var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var check = require("validator").check;
var crypto = require("crypto");
var config = require("config");
var Errors = require("../error/errors");

module.exports = {
    forUserWithToken: function (token, callback) {
	if (!token) {
	    callback(Errors.Unauthorized());
	    return;
	}

	userModel.getByToken(token, function (err, user) {
	    if (err) {
		logger.warn("[userService.forUserWithToken, ", token, "] Can't find user by token, because: ", err);
		callback(Errors.System(err));
		return;
	    } else if (!user) {
		logger.warn("[userService.forUserWithToken, ", token, "] Can't find user by token because user from db is empty");
		callback(Errors.Unauthorized());
		return;
	    }
		
	    logger.debug("[userService.forUserWithToken, ", token, "] Return user.");
	    callback(null, user);
	});
    },
    destroyAuthToken: function (user, callback) {
	user.authToken = "";
	userModel.update(user);
	callback(null, {command: "logout", result: "done"});
    },
    getUser: function (user, callback) {
	logger.debug("[userService.getUser, ", user.email, "] Try get user");
	var userJSON = {
	    email: user.email,
	    foods: []
	}
	async.each(user.foods, function (food, done) {
	    if (food) {
		logger.debug("[userService.getUser, ", user.email, "] Remove food.user.userId and food.stranger.strangerId in food");
		delete food.user.user;
		delete food.stranger.user;
		delete food.user.location;
		delete food.stranger.location;
		if (food.stranger.report) {
		    food.stranger.foodUrl = config.app.reportedFoodStub; 
		}
		userJSON.foods.push(food);
	    }
	    done();
	}, function (err) {
	    if (err) {
		logger.warn("[userService.getUser, ", userId, "] Error when each foods for: ", user);
		callback(Errors.System(err));
		return;
	    }
	    callback(null, userJSON);
	});
    },
    findOrCreateByLoginAndPassword: function (email, password, callback) {
	logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] Try find or create for user with email: ", email);

	if (!email || !password) {
	    logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] Email or password is incorrect. Return error");
	    callback(Errors.LoginAndPasswordIncorrectArgs());
	    return;
	}

	var self = this;
	userModel.getByEmail(email, function(err, user) {
	    if (err) {
		logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't userModel.getByEmail, because: ", err);
		callback(Errors.System(err));
		return;
	    }
	    if (user) {
		logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] User exist.");
		if (self.isPasswordCorrect(password, user)) {
		    user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		    userModel.update(user, function (err) {
			if (err) {
			    logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't update user with new authToken, because: ", err);
			    callback(Errors.System(err));
			    return;
			}
			callback(null, {token: user.authToken});
		    });
		} else {
		    logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] user: ", email, " type incorrect password");
		    callback(Errors.LoginAndPasswordIncorrectArgs());
		}
	    } else {
		logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] user not exist. Try create him");
		var user = {
		    authToken: crypto.randomBytes(config.app.tokenLength).toString('hex'),
		    email: email,
		    password: self.generateHashForPassword(email, password)
		}

		logger.data("[userService.findOrCreateByLoginAndPassword, ", email, "] Try create user in db.");
		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't create user, because: ", err);
			return;
		    }

		    logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] User created.");
		    callback(null, {token: user.authToken});
		});
	    }
	});
    },
    generateHashForPassword: function (email, password) {
	logger.data("[userService.generateHashForPassword, ", email, "] Try generate hash.");
	var sha1sum = crypto.createHash("sha1");
	sha1sum.update(password + email + config.app.secret);
	return sha1sum.digest("hex");
    },
    isPasswordCorrect: function (password, user) {
	logger.data("[userService.isPasswordCorrect, ", user, "] Try compare passwords: ", user.password, " == ", this.generateHashForPassword(user.email, password));
	return user.password == this.generateHashForPassword(user.email, password);
    },
    findOrCreateAnonymous: function (id, callback) {
	if (!id) {
	    callback(Errors.IncorrectAnonymousId());
	    return;
	}

	var email =  id + "@" + config.app.anonymousEmailPosftix;
	userModel.getByEmail(email, function(err, user) {
	    if (err) {
		callback(Errors.System(err));
		return;
	    }

	    if (user) {
		logger.warn("[userService.findOrCreateAnonymous, ", email, "] User already exist");
		user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		userModel.update(user, function (err) {
		    if (err) {
			logger.warn("[userService.findOrCreateAnonymous, ", email, "] Can't update user with new authToken, because: ", err);
			callback(Errors.System(err));
			return;
		    }
		    logger.debug("[userService.findOrCreateAnonymous, ", email, "] User authToken updated in db: ", user.authToken);
		    callback(null, {token: user.authToken});
		});
	    } else {
		logger.debug("[userService.findOrCreateAnonymous, ", email, " User not exist. Try create him");
		var user = {
		    authToken: crypto.randomBytes(config.app.tokenLength).toString('hex'),
		    anonymousId: id,
		    email: email
		}
		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateAnonymous, ", user.id, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    }
		    logger.data("[userService.findOrCreateAnonymous, ", user.id, "] Anonymous user created.");
		    callback(null, {token: user.authToken});
		});
	    }
	});
    },
    verifyFacebookAndFindOrCreateUser: function (id, email, token, callback) {
	logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Start");

	var self = this;
	require("https").get({
	    hostname: config.app.fb.host,
	    port: config.app.fb.port,
	    path: '/' + id + '?fields=id,email&access_token=' + token
	}, function(resp) {
	    resp.on('data', function(chunk) {
		var json = JSON.parse(chunk.toString("utf8"));
		logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Recive json: ", json);
		if (json.email == email) {
		    logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Emails is equals");
		    self.findOrCreateByFBData({email: email, id: id}, callback);
		} else {
		    logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Emails is not equals. Return incorrect args");
		    callback(Errors.FBIncorrectArgs());
		}
	    }).on("error", function(e){
		logger.warn("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Error in communication with Facebook: ", e);
		callback(Errors.FacebookError());
	    });
	});
    },
    verifyGoogleAndFindOrCreateUser: function (email, familyName, token, callback) {
	logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Start");

	var self = this;
	require("https").get({
	    hostname: config.app.google.host,
	    port: config.app.google.port,
	    path: config.app.google.path + token
	}, function(resp) {
	    resp.on('data', function (chunk) {
		var json = JSON.parse(chunk.toString("utf8"));
		logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Recive json: ", json);
		if (json.family_name = familyName) {
		    logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] family names is equals");
		    self.findOrCreateByGoogleData(json.id, email, callback);
		} else {
		    logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] family names is not eql. Return incorrect args.");
		    callback(Errors.GoogleIncorrectArgs());
		}
	    }).on("error", function (e) {
		logger.warn("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Error in communication with Google: ", e);
		callback(Errors.GoogleError());
	    });
	});
    },
    findOrCreateByFBData: function (data, callback) {
	logger.data("[userService.findOrCreateByFBData, ", data, "] Try find or create.");

	if (!data || !data.email) {
	    logger.data("[userService.findOrCreateByFBData, ", data, "] Data or data.email is incorrect. Return error.");
	    callback(Errors.FBIncorrectArgs());
	    return;
	}

	userModel.getByEmail(data.email, function (err, user) {
	    if (err) {
		logger.warn("[userService.findOrCreateByFBData, ", data.email, "] Can't get user by email, because: ", err);
		callback(Errors.System(err));
		return;
	    }

	    if (user) {
		logger.warn("[userService.findOrCreateByFBData, ", user.id, "] User ", data.email, " exist");
		user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		userModel.update(user, function (err) {
		    if (err) {
			logger.warn("[userService.findOrCreateByFBData, ", email, "] Can't update user with new authToken, because: ", err);
			callback(Errors.System(err));
			return;
		    }
		    callback(null, {token: user.authToken});
		});
	    } else {
		logger.debug("[userService.findOrCreateByFBData, ", data.email, " User not exist. Try create him");

		var user = {
		    authToken: crypto.randomBytes(config.app.tokenLength).toString('hex'), 
		    facebookId: data.id,
		    email: data.email,
		}

		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateByFBData, ", user.id, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    }

		    logger.data("[userService.findOrCreateByFBData, ", user.id, "] User created: ", user);
		    callback(null, {token: user.authToken});
		});
	    }
	});
    },
    findOrCreateByGoogleData: function (id, email, callback) {
	logger.data("[userService.findOrCreateByGoogleData, ", email, "] Try find or create.");

	if (!email) {
	    logger.data("[userService.findOrCreateByGoogleData, ", email, "] Data or data.email is incorrect. Return error.");
	    callback(Errors.GoogleIncorrectArgs());
	    return;
	}

	userModel.getByEmail(email, function (err, user) {
	    if (err) {
		logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't get user by email, because: ", err);
		callback(Errors.System(err));
		return;
	    }

	    if (user) {
		logger.warn("[userService.findOrCreateByGoogleData, ", user.id, "] User ",email, " exist");
		user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		user.googleId = id;
		userModel.update(user, function (err) {
		    if (err) {
			logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't update user with new authToken, because: ", err);
			callback(Errors.System(err));
			return;
		    }
		    callback(null, {token: user.authToken});
		});
	    } else {
		logger.debug("[userService.findOrCreateByGoogleData, ", email, " User not exist. Try create him");

		var user = {
		    authToken: crypto.randomBytes(config.app.tokenLength).toString('hex'), 
		    googleId: id, 
		    email: email,
		}

		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    }

		    logger.data("[userService.findOrCreateByGoogleData, ", email, "] User created: ", user);
		    callback(null, {token: user.authToken});
		});
	    }
	});
    }
};

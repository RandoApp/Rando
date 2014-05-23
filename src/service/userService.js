var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var crypto = require("crypto");
var config = require("config");
var Errors = require("../error/errors");

module.exports = {
    forUserWithToken: function (token, ip, callback) {
	if (!token) {
	    callback(Errors.Unauthorized());
	    return;
	}

	var self =  this;
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

	    self.updateIp(user, ip);

	    logger.debug("[userService.forUserWithToken, ", token, "] Return user.");
	    callback(null, user);
	});
    },
    forUserWithTokenWithoutSpam: function (token, ip, callback) {
		this.forUserWithToken(token, ip, function (err, user) {
                        if (err) {
                            callback(err);
                            return;
                        }

			if (user.ban && Date.now() <= user.ban) {
				logger.warn("[userService.forUserWithTokenWithoutSpam, ", user.email, "] Banned user send request. Ban to: ", user.ban);
				callback(Errors.Forbidden(user.ban));
				return;
			}

			var randos = user.randos;
			if (randos.length > config.app.limit.images) {
				randos.sort(function (rando1, rando2) {
					return rando2.user.creation - rando1.user.creation;
				});

				var timeBetwenImagesLimit = randos[0].user.creation - randos[config.app.limit.images - 1].user.creation;
				logger.debug("[userService.forUserWithTokenWithoutSpam, ", user.email, "] first image creation: ", randos[0].user.creation, " last in limit image creation: ", randos[config.app.limit.images - 1].user.creation, " Time between Images limit: ", timeBetwenImagesLimit);

				if (timeBetwenImagesLimit <= config.app.limit.time) {
					user.ban = Date.now() + config.app.limit.ban;
					userModel.update(user, function (err) {
						if (err) {
							logger.warn("[userService.forUserWithTokenWithoutSpam, ", user.email, "] Can't update user for ban, because: ", err);
						}

						logger.debug("[userService.forUserWithTokenWithoutSpam, ", user.email, "] Spam found. Return error.");
						callback(Errors.Forbidden(user.ban));
						return;
					});
				    return;
				}
			}
			
			logger.debug("[userService.forUserWithTokenWithoutSpam, ", user.email, "] User ok.  Return user.");
			callback(null, user);
		});
    },
    updateIp: function (user, ip) {
	if (!user.ip || (user.ip && user.ip != ip)) {
		user.ip = ip;
		logger.debug("[userService.updateIp, ", user.email, "] Update ip to: ", ip);
		userModel.update(user);
		return;
	}
	logger.debug("[userService.updateIp, ", user.email, "] Don't update user ip, because this ip already exists: ", ip);
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
	    randos: []
	}
	async.each(user.randos, function (rando, done) {
	    if (rando) {
		var randoJSON = {
			stranger: {
				creation: rando.stranger.creation,
				randoId: rando.stranger.randoId,
				report: rando.stranger.report,
				imageURL: rando.stranger.imageURL,
				imageSizeURL: rando.stranger.imageSizeURL,
				mapURL: rando.stranger.mapURL,
				mapSizeURL: rando.stranger.mapSizeURL
			},
			user: {
				creation: rando.user.creation,
				randoId: rando.user.randoId,
				report: rando.user.report,
				imageURL: rando.user.imageURL,
				imageSizeURL: rando.user.imageSizeURL,
				mapURL: rando.user.mapURL,
				mapSizeURL: rando.user.mapSizeURL
			}
		}
		if (rando.stranger.report) {
		    randoJSON.stranger.imageURL = config.app.reportedImageStub; 
		    randoJSON.stranger.imageSizeURL.small = config.app.reportedImageStub; 
		    randoJSON.stranger.imageSizeURL.medium = config.app.reportedImageStub; 
		    randoJSON.stranger.imageSizeURL.large = config.app.reportedImageStub; 

		    randoJSON.stranger.mapURL = config.app.reportedImageStub; 
		    randoJSON.stranger.mapSizeURL.small = config.app.reportedImageStub; 
		    randoJSON.stranger.mapSizeURL.medium = config.app.reportedImageStub; 
		    randoJSON.stranger.mapSizeURL.large = config.app.reportedImageStub; 
		}
		//TODO: Remove this lines when all clients will be apdated
		randoJSON.user.bonAppetit = 0;
		randoJSON.stranger.bonAppetit = 0;
		//TODO: Remove this lines when all clients will be apdated
		userJSON.randos.push(randoJSON);
	    }
	    done();
	}, function (err) {
	    if (err) {
		logger.warn("[userService.getUser, ", userId, "] Error when each randos for: ", user);
		callback(Errors.System(err));
		return;
	    }
	    callback(null, userJSON);
	});
    },
    findOrCreateByLoginAndPassword: function (email, password, ip, callback) {
	logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] Try find or create for user with email: ", email);

	if (!email || !/.+@.+\..+/.test(email) || !password) {
	    logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Email or password is incorrect. Return error");
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
                    user.ip = ip;
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
		    password: self.generateHashForPassword(email, password),
                    ip: ip
		}

		logger.data("[userService.findOrCreateByLoginAndPassword, ", email, "] Try create user in db.");
		userModel.create(user, function (err) {
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
	logger.data("[userService.isPasswordCorrect, ", user.email, "] Try compare passwords: ", user.password, " == ", this.generateHashForPassword(user.email, password));
	return user.password == this.generateHashForPassword(user.email, password);
    },
    findOrCreateAnonymous: function (id, ip, callback) {
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
		user.ip = ip;
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
		    email: email,
                    ip: ip
		}
		userModel.create(user, function (err) {
		    if (err) {
			logger.warn("[userService.findOrCreateAnonymous, ", user.email, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    }
		    logger.data("[userService.findOrCreateAnonymous, ", user.email, "] Anonymous user created.");
		    callback(null, {token: user.authToken});
		});
	    }
	});
    },
    verifyFacebookAndFindOrCreateUser: function (id, email, token, ip, callback) {
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
		    self.findOrCreateByFBData({email: email, id: id, ip: ip}, callback);
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
    verifyGoogleAndFindOrCreateUser: function (email, familyName, token, ip, callback) {
	logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Start");

	var self = this;
	var googleJson = "";

	require("https").get({
	    hostname: config.app.google.host,
	    port: config.app.google.port,
	    path: config.app.google.path + token
	}, function(resp) {
		resp.on('data', function (chunk) {
			googleJson += chunk.toString("utf8");
		}).on('end', function (chunk) {
			try {
				var json = JSON.parse(googleJson);
			} catch (e) {
				logger.warn("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Bad JSON: ", e.message);
				callback(Errors.GoogleError());
				return;
			}
			logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Recive json: ", json);
			if (json.family_name = familyName) {
				logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] family names is equals");
				self.findOrCreateByGoogleData(json.id, email, ip, callback);
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
		logger.warn("[userService.findOrCreateByFBData, ", user.email, "] User ", data.email, " exist");
		user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		user.ip = data.ip;
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
                    ip: data.ip
		}

		userModel.create(user, function (err) {
		    if (err) {
			logger.warn("[userService.findOrCreateByFBData, ", user.email, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    }

		    logger.data("[userService.findOrCreateByFBData, ", user.email, "] User created: ", user);
		    callback(null, {token: user.authToken});
		});
	    }
	});
    },
    findOrCreateByGoogleData: function (id, email, ip, callback) {
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
		logger.warn("[userService.findOrCreateByGoogleData, ", user.email, "] User ",email, " exist");
		user.authToken = crypto.randomBytes(config.app.tokenLength).toString('hex');
		user.googleId = id;
		user.ip = ip;
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
			ip: ip
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

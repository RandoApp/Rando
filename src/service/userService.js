var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var check = require("validator").check;
var crypto = require("crypto");
var config = require("config");
var Errors = require("../error/errors");

module.exports = {
    getUser: function (userId, callback) {
	logger.debug("[userService.getUser, ", userId, "] Try get user");
	userModel.getById(userId, function(err, user) {
	    if (err) {
		logger.warn("[userService.getUser, ", userId, "] Can't userModel.getById, because: ", err);
		callback(Errors.System(err));
		return;
	    }
	    if (!user) {
		logger.debug("[userService.getUser, ", userId, "] User not found. Return Error.");
		callback(Errors.UserForGetNotFound());
		return;
	    } else {
		logger.debug("[userService.getUser, ", userId, "] User found: ", user, " Try process him.");
		var userJSON = {
		    email: user.email,
		    foods: []
		}
		async.each(user.foods, function (food, done) {
		    if (food) {
			logger.debug("[userService.getUser, ", userId, "] Remove food.user.userId and food.stranger.strangerId in food: ", food);
			delete food.user.userId;
			delete food.stranger.strangerId;
			delete food.user.location;
			delete food.stranger.location;
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
	    }
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
		logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] User exist: ", user);
		if (self.isPasswordCorrect(password, user)) {
		    callback(null, user.id);
		} else {
		    logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] user: ", email, " type incorrect password");
		    callback(Errors.LoginAndPasswordIncorrectArgs());
		}
	    } else {
		logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] user not exist. Try create him");
		var user = {
		    email: email,
		    password: self.generateHashForPassword(email, password)
		}

		logger.data("[userService.findOrCreateByLoginAndPassword, ", email, "] Try create user: ", user);
		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't create user, because: ", err);
			return;
		    }

		    logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] User created.");
		    callback(null, user.id);
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
		callback(null, user.id);
	    } else {
		logger.debug("[userService.findOrCreateByFBData, ", data.email, " User not exist. Try create him");
		var user = {
		    facebookId: data.id,
		    email: data.email,
		}
		userModel.create(user, function (err, user) {
		    if (err) {
			logger.warn("[userService.findOrCreateByFBData, ", user.id, "] Can't create user because: ", err);
			callback(Errors.System(err));
			return;
		    };
		    logger.data("[userService.findOrCreateByFBData, ", user.id, "] User created: ", user);
		    callback(null, user.id);
		});
	    }
	});
    }
};

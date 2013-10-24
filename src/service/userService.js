var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var check = require("validator").check;
var crypto = require("crypto");
var config = require("config");

module.exports = {
    findOrCreateByLoginAndPassword: function (email, password, callback) {
	if (!email || !password) {
	    callback(new Error("Invalid email"));
	    return;
	}

	var self = this;
	userModel.getByEmail(email, function(err, user) {
	    if (err) {
		logger.warn("Error when user.getByEmail: ", err);
		callback(err);
		return;
	    }
	    if (user) {
		logger.debug("User exist: ", user);
		if (self.isPasswordCorrect(password, user)) {
		    callback(null, user.id);
		} else {
		    callback(new Error("Password is not correct"));
		}
	    } else {
		logger.debug("Can't find user. Create him");
		var user = {
		    email: email,
		    password: self.generateHashForPassword(email, password)
		}

		userModel.create(user, function (err, user) {
		    callback(null, user.id);
		});
	    }
	});
    },
    generateHashForPassword: function (email, password) {
	var sha1sum = crypto.createHash("sha1");
	sha1sum.update(password + email + config.app.secret);
	return sha1sum.digest("hex");
    },
    isPasswordCorrect: function (password, user) {
	logger.debug(user.password + " == " + this.generateHashForPassword(user.email, password));
	return user.password == this.generateHashForPassword(user.email, password);
    },
    findOrCreateByFBData: function (data, callback) {
	if (!data || !data.email) {
	    callback(new Error("No email"));
	    return;
	}

	userModel.getByEmail(data.email, function (err, user) {
	    if (err) {
		logger.warn("Error when user.getByEmail: ", err);
		callback(err);
		return;
	    }
	    if (user) {
		logger.debug("User exist: ", user);
		callback(null, user.id);
	    } else {
		logger.debug("Can't find user. Create him");
		var user = {
		    facebookId: data.id,
		    email: data.email,
		}
		userModel.create(user, function (err, user) {
		    callback(null, user.id);
		});
	    }
	});
    }
};

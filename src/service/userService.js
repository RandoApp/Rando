var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var check = require("validator").check;
var crypto = require("crypto");
var config = require("config");

module.exports = {
    findOrCreateByLoginAndPassword: function (email, password, callback) {
	if (!email || !password) {
	    callback(new Error("No email"));
	    return;
	}

	var self = this;
	userModel.getByEmail(email, function(err, user) {
	    if (err) {
		logger.warn("Error when user.getByEmail: ", err);
		callback(new Error("Error db"));
		return;
	    }
	    if (user) {
		logger.debug("User exist: ", user);
		if (self.isPasswordCorrect(password, user)) {
		    callback(null, user.id);
		} else {
		    callback(new Error("password is not correct"));
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
		callback(new Error("Error db"));
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
    },
    findUserById: function (id, callback) {
	userModel.getById(id, function (err, user) {
	    if (err) {
		logger.warn("Can't find user by id: ", id);
		callback(err);
		return;
	    }
	    if (!user) {
		logger.debug("User is null");
		callback(new Error("User not found"));
		return;
	    }
	    logger.debug("User found by id: ", user);
	    callback(null, user);
	});
    },
    registerByEmailAndPassword: function (email, password, callback) {
	async.series([
	    function (done) {
		try {
		    check(email).isEmail();
		    check(password, "Empty password").notEmpty();

		    logger.debug("user.ervice.registerByEmailAndPassword arguments verification succeffuly done");
		    done();
		} catch (exc) {
		    done(new Error(exc.message));
		}
	    },
	    function (done) {
		userModel.getByEmail(email, function(err, user) {
		    if (err) {
			logger.warn("Can't find user by email: ", email);
			done(err);
			return;
		    }
		    if (user) {
			logger.info("User already exists");
			done(new Error("User already exists"));
			return;
		    }

		    logger.debug("User with email %s is not exist. Nice!", email); 
		    done();
		});
	    },
	    function (done) {
		userModel.create({email: email, password: password}, function (err) {
		    if (err) {
			logger.warn("Can't create user. Email: ", email);
			done(err);
			return;
		    }

		    logger.debug("User created. Nice!");
		    callback();
		    done();
		});
	    }
	], function (err) {
	    if (err) {
		logger.debug("Async error captured: ", err.message);
		callback(err);
		return;
	    }

	    logger.debug("Async process serias without any error");
	});
    }
};

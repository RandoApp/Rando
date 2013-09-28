var logger = require("../log/logger");
var account = require("../model/account");
var async = require("async");

module.exports = {
    findOrCreateByFBData: function (data, promise) {
	if (!data && !data.email) {
	    promise.fail();
	    return;
	}

	account.getByEmail(data.email, function (err, user) {
	    if (err) {
		logger.warn("Error when account.getByEmail: ", err);
		promise.fail();
		return;
	    }
	    if (user) {
		logger.debug("User exist: ", user);
		promise.fulfill(user);
	    } else {
		logger.debug("Can't find user. Create him");
		var user = {
		    authId: data.id,
		    email: data.email,
		    food: []
		}
		account.create(user);
		promise.fulfill(user);
	    }
	});
    },
    findUserById: function (id, callback) {
	account.getById(id, function (err, user) {
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
		if (!email && !password) {
		    done(new Error("Miss email and password"));
		    return;
		}
		if (!email) {
		    done(new Error("Miss email"));
		    return;
		}
		if (!password) {
		    done(new Error("Miss password"));
		    return;
		}
		if (!callback) {
		    logger.warn("Hey, programmer. You forgot pass callback to accountService.registerByEmailAndPassword");
		    done(new Error("Sorry"));
		}

		logger.debug("accountService.registerByEmailAndPasswword arguments verification succeffuly done");
		done(null);
	    },
	    function (done) {
		account.getByEmail(email, function(err, user) {
		    if (err) {
			logger.warn("Can't find user by email: ", email);
			done(new Error("Can't find user by email"));
			return;
		    }
		    if (user) {
			logger.info("User already exists");
			done(new Error("User already exists"));
			return;
		    }

		    logger.debug("User with email %s is not exist. Nice!", email); 
		    done(null);
		});
	    },
	    function (done) {
		account.create({email: email, password: password}, function (err) {
		    if (err) {
			logger.warn("Can't create account! Email: %s, food: %s", email, food);
			done(new Error("Sorry"));
			return;
		    }

		    logger.debug("User created. Nice!");
		    callback(null);
		    done(null);
		});
	    }
	], function (err) {
	    if (err) {
		logger.debug("Async error captured: ", err.message);
		callback(err);
		return;
	    }

	    logger.debug("Async process serias withot any error");
	});
    }
};

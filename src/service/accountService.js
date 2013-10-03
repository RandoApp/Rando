var logger = require("../log/logger");
var account = require("../model/accountModel");
var async = require("async");
var check = require("validator").check;

module.exports = {
    findOrCreateByFBData: function (data, promise) {
	if (!data || !data.email) {
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
		try {
		    check(email).isEmail();
		    check(password, "Empty password").notEmpty();

		    logger.debug("accountService.registerByEmailAndPassword arguments verification succeffuly done");
		    done();
		} catch (exc) {
		    done(new Error(exc.message));
		}
	    },
	    function (done) {
		account.getByEmail(email, function(err, user) {
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
		account.create({email: email, password: password}, function (err) {
		    if (err) {
			logger.warn("Can't create account! Email: ", email);
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

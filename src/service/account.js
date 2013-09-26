var logger = require("../log/logger.js");
var account = require("../model/account");

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
		console.log(user.userId);
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
    }
    
};

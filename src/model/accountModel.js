var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Account = mongoose.model("account", new mongoose.Schema({
    email: String,
    authId: String,
    food: Array
}));

module.exports = {
    create: function (user, callback) {
	if (!user) {
	    logger.warn("Hey, programmer! You forgot pass user arg to account.create! or passed user arg is undefined!");
	    return;
	}

	if (!user.email) {
	    logger.warn("Hey, programmer! account.create must contains email value in arg object!");
	    return;
	}
	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("Can't create account! Email: %s, food: %s", email, food);
		    return;
		}

		logger.debug("Account created: ", account);
	    };
	}

	user.food = [];

	logger.data("Create account: Email: ", user);

	var account = new Account(user);
	account.save(callback);
    },
    update: function (account) {
	if (account && account instanceof mongoose.Model) {
	    logger.data("Update account: Email: %s, food: ", account.email, account.food);

	    account.save(function (err) {
		if (err) {
		    logger.warn("Can't upadate account! Email: %s, food: ", account.email, account.food);
		    return;
		}

		logger.debug("Account updated. Email: %s, food: ", account.email, account.food);
	    });
	}
    },
    getByEmail: function (email, callback) {
	logger.data("Try find user by email: ", email);
	Account.findOne({email: email}, callback);
    },
    getById: function (id, callback) {
	logger.data("Try find user by id: ", id);
	Account.findById(id, callback);
    }
};

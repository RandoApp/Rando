var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Account = mongoose.model("account", new mongoose.Schema({
    userId: String,
    email: String,
    food: Array
}));

module.exports = {
    create: function (user) {
	if (!user) {
	    logger.warn("Hey, programmer! You forgot pass user arg to account.create! or passed user arg is undefined!");
	    return;
	}

	if (!user.userId || !user.email) {
	    logger.warn("Hey, programmer! account.create must contains: userId and email values in arg object!");
	    return;
	}

	user.food = [];

	logger.data("Create account: Email: ", user);

	var account = new Account(user);

	account.save(function (err) {
	    if (err) {
		logger.warn("Can't create account! Email: %s, food: %s", email, food);
		return;
	    }

	    logger.debug("Account created: ", account);
	});
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
	Account.findOne({email: email}, callback);
    },
    getById: function (id, callback) {
	Account.findOne({userId: id}, callback);
    }
};

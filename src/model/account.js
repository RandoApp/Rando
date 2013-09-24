var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Account = mongoose.model("account", new mongoose.Schema({
    email: String,
    food: Array
}));

module.exports = {
    create: function (email, food) {
	logger.data("Create account: Email: %s, food: ", email, food);

	var account = new Account({email: email, food: []});

	account.save(function (err) {
	    if (err) {
		logger.warn("Can't create account! Email: %s, food: %s", email, food);
	    }

	    logger.debug("Account created. Email: %s, food: ", account.email, account.food);
	});
    },
    update: function (account) {
	if (account && account instanceof mongoose.Model) {
	    logger.data("Update account: Email: %s, food: ", account.email, account.food);

	    account.save(function (err) {
		if (err) {
		    logger.warn("Can't upadate account! Email: %s, food: ", account.email, account.food);
		}

		logger.debug("Account updated. Email: %s, food: ", account.email, account.food);
	    });
	}
    },
    getByEmail: function (email, callback) {
	Account.findOne({email: email}, callback);
    },
    getById: function (id, callback) {
	Account.findById(id, callback);
    }
};

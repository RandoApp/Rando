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

	account.save( function (err) {
	    if (err) {
		logger.warn("Can't create account! Email: %s, food: %s", email, food);
	    }
	});
    }
};

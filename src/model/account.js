var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Account = mongoose.model("account", new mongoose.Schema({
    email: String,
    food: Array
}));

module.exports = {
    create: function (email) {
	var account = new Account({email: email, food: []});
	logger.debug("Create account with email: %s and empty food", email);

	account.save( function (err) {
	    if (err) {
		console.log(err);
	    }
	});
    }
};

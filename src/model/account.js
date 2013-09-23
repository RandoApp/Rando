var mongoose = require('mongoose');
var config = require("config");

var Account = mongoose.model("account", new mongoose.Schema({
    email: String,
    food: Array
}));

module.exports = {
    create: function (email, food) {
	var account = new Account({email: email, food: food});
	console.log(email + " " +  food);

	account.save(function (err) {
	    if (err) {
		console.log(err);
	    }
	});
    }
};

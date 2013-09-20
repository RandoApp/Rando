var mongoose = require('mongoose');
var config = require("config");

mongoose.connect(config.db.url);

var db = mongoose.connection;

var Account = mongoose.model("account", new mongoose.Schema({
    email: String,
    food: Array
}));

var Food = mongoose.model("food", new mongoose.Schema({
    location: String
}));

db.on("error", function () {
    console.log("error");
});

db.on("open", function () {
    console.log("open");
});


module.exports = {
    create: function (email, food) {
	var account = new Account({email: email, food: food});

	account.save(function (err) {
	    if (err) {
		console.log(err);
	    }
	});
    }
};

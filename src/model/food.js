var mongoose = require("mongoose");
var config = require("config");

var Food = mongoose.model("food", new mongoose.Schema({
    email: String,
    food: Array
}));

module.exports = {
    add: function (email, food) {
	var food = new Food({email: email, food: food});

	food.save(function (err) {
	    if (err) {
		console.log(err);
	    }
	});
    }
};

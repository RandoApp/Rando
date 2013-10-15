var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Food = mongoose.model("food", new mongoose.Schema({
    email: String,
    location: Number,
    creation: Date,
    name: String,
    map: String 
}));

module.exports = {
    add: function (email, location, creation, name, map, callback) {
	logger.data("Food add. Email: %s, location: %s, creation: %s, name: %s, map: %s", email, location, creation, name, map);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("Can't add food! Email: %s, location: %s, creation: %s, name: %s, map: %s", email, location, creation, name, map);
		    return;
		}
		logger.debug("Food added. Email: %s, location: %s, creation: %s, name: %s, map: %s", email, location, creation, name, map);
	    }
	}

	var food = new Food({
	    email: email,
	    location: location,
	    creation: creation,
	    name: name,
	    map: map
	});

	food.save(callback);
    },
    getAll: function (callback) {
	Food.find(callback);
    },
    remove: function (food) {
	if (food && food instanceof mongoose.Model) {
	    food.remove(function (err) {
		if (err) {
		    logger.warn("Can't remove food! %j", food); 
		    return;
		}
		logger.debug("Food removed. Email: %s, location: %s, creation: %s, name: %s, map: %s", food.email, food.location, food.creation, food.name, food.map);
	    });
	}
    }
}

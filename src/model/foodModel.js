var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Food = mongoose.model("food", new mongoose.Schema({
    user: String,
    location: Number,
    creation: Date,
    name: String,
    map: String 
}));

module.exports = {
    add: function (userId, location, creation, name, callback) {
	logger.data("Food add. User: ", userId, " , location: ", location, ", creation: ", creation, ", name: ", name);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("Can't add food! User: %s, location: %s, creation: %s, name: %s, map: %s", userId, location, creation, name, map);
		    return;
		}
		logger.debug("Food added. User: %s, location: %s, creation: %s, name: %s, map: %s", userId, location, creation, name, map);
	    }
	}

	var food = new Food({
	    user: userId,
	    location: location,
	    creation: creation,
	    name: name,
	    map: null
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
		logger.debug("Food removed. User: %s, location: %s, creation: %s, name: %s, map: %s", food.user, food.location, food.creation, food.name, food.map);
	    });
	}
    }
}

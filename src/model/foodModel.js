var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Food = mongoose.model("food", new mongoose.Schema({
    user: String,
    location: Number,
    creation: Number,
    foodId: String,
    foodUrl: String,
    mapUrl: String 
}));

module.exports = {
    add: function (userId, location, creation, foodId, foodUrl, callback) {
	logger.data("Food add. User: ", userId, " , location: ", location, ", creation: ", creation, ", foodId: ", foodId, "foodUrl: ", foodUrl);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("Can't add food! User: ", userId, " location: ", location, " creation: ", creation, " foodId: ", foodId, "foodUrl: ", foodUrl, "mapUrl: null");
 		    return;
		}
		logger.debug("Food added. User: ", userId, " location: ", location, " creation: ", creation, "foodId: ", foodId, " foodUrl: ", foodUrl, "mapUrl: null");
	    }
	}

	var food = new Food({
	    user: userId,
	    location: location,
	    creation: creation,
	    foodId: foodId,
	    foodUrl: foodUrl,
	    mapUrl: null
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
		logger.debug("Food removed. User: ", food.user, " location: ", food.location, "creation: ", food.user.creation, " foodId: ", food.foodId, " foodUrl: ", food.foodUrl, "mapUrl: ", mapUrl);
	    });
	}
    }
}

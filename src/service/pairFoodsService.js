var logger = require("../log/logger");
var userModel = require("../model/userModel");
var foodModel = require("../model/foodModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    timer: null,
    pairFoods: function () {
	logger.debug("Pair Foods Demon start work");
	var self = this;
	foodModel.getAll(function (err, foods) {
	    if (err) {
		logger.warn("[pairFoodsService.pairFoods] Can't get all foods: ", err);
		return;
	    }

	    logger.debug("----------- ALL FOODS: ", foods.length); 

	    var oldFood = null;
	    async.filter(foods, function (food, callback) {
		if (food.creation) {
		    callback(true);
		    return;
		} else if (!oldFood) {
		    oldFood = food;
		} 
		callback(false);
	    }, function (foodsForPairs) {
		logger.debug("----------- filter END: ", foodsForPairs, " and oldFood: ", oldFood);
		self.findAndPairFoods(foodsForPairs);
	    });
	});
    },
    findAndPairFoods: function (foods) {
	logger.debug("Start findAndPairFoods with foods: ", foods);
	for (var i = 0; i < foods.length; i++) {
	    var currentFood = foods[i];
	    var food = this.findFoodForUser(currentFood, foods);
	    logger.debug("findAndPairFoods. Get food: ", food, " and foods now look as: ", foods);
	    if (food) {
		this.connectFoods(currentFood, food);
	    }
	}
    },
    findFoodForUser: function (food, foods) {
	logger.debug("Start findFoodForUser");
	for (var i = 0; i < foods.length; i++) {
	    logger.debug("Compare users: ", food.user, " == ", foods[i].user);
	    if (food.user != foods[i].user) {
		logger.debug("Stop findFoodForUser. return food[", i, "]: ", foods[i]);
		return foods.splice(i, 1)[0];
	    }
	}
	logger.debug("Stop findFoodForUser. return null");
	return null;
    },
    connectFoods: function (food1, food2) {
	logger.debug("Start connectFoods with food1: ", food1, "and food2:  ", food2);
	this.processFoodForUser(food1.user, food2);
	this.processFoodForUser(food2.user, food1);
    },
    processFoodForUser: function (userId, food) {
	logger.debug("Try find user by id: ", userId);
	userModel.getById(userId, function (err, user) {
	    if (err) {
		logger.warn("Data base error when getById: ", userId);
		return;
	    }

	    if (!user) {
		logger.warn("User not found: ", userId);
		return;
	    }

	    logger.debug("Find user: ", user);
	    for (var i = 0; i < user.foods.length; i++) {
		if (!user.foods[i].stranger.user) {
		    logger.debug("Food for pairing found");
		    user.foods[i].stranger = food;
		    logger.warn(">>>>>>>>>>>>>>>>>>>>>>>>>>> ", user);
		    userModel.update(user);
		    foodModel.remove(food);
		    return;
		}
	    }
	});
    },
    startDemon: function () {
	logger.info("Start pair foods demon with interval wakeup: ", config.app.demon.wakeup);
	var self = this;
	this.timer = setInterval(function () {
	    self.pairFoods();
	}, config.app.demon.wakeup);
    },
    stopDemon: function () {
	if (this.timer) {
	    logger.info("Stop pair foods demon");
	    clearInterval(this.timer);
	    this.timer = null;
	}
    }
};

var logger = require("../log/logger");
var userModel = require("../model/userModel");
var foodModel = require("../model/foodModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    pairFoodDemonTimer: null,
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
		if (foodsForPairs.length > 1) {
		    if (foodsForPairs.length % 2 != 0) {
			logger.debug("Ignore one food, because is all foods is odd");
			foodsForPairs.pop();
		    }
		    self.findAndPairFoods(foodsForPairs);
		}
	    });
	});
    },
    findAndPairFoods: function (foods) {
	for (var i = 0; i < foods.length; i++) {
	    var food = this.findFoodForUser(foods[i], foods);
	    if (food) {
		this.connectFoods(food[i], food);
	    }
	}
    },
    connectFoods: function (food1, food2) {
	this.processFoodForUser(food1.user, food2);
	this.processFoodForUser(food2.user, food1);
    },
    processFoodForUser: function (userId, food) {
	userModel.getById(userId, function (err, user) {
	    logger.debug("Find user: ", user.id);
	    for (var i = 0; i < user.foods.length; i++) {
		if (!user.foods[i].stranger.user) {
		    logger.debug("Food for pairing fount");
		    user.foods[i].stranger = food;
		    userModel.update(user);
		    foodModel.remove(food);
		    return;
		}
	    }
	});
    },
    findFoodForUser: function (food, foods) {
	for (var i = 0; i < foods.length; i++) {
	    if (food.user != foods[i].user) {
		return foods.splice[i, 1];
	    }
	}
	return null;
    },
    startPairFoodsDemon: function () {
	logger.info("Start pair foods demon with interval wakeup: ", config.app.demon.wakeup);
	var self = this;
	this.pairFoodDemonTimer = setInterval(function () { self.pairFoods(); }, config.app.demon.wakeup);
    },
    stopPairFoodsDemon: function () {
	if (this.pairFoodDemonTimer) {
	    logger.info("Stop pair foods demon");
	    clearInterval(this.pairFoodDemonTimer);
	    this.pairFoodDemonTimer = null;
	}
    }
};

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

	    if (!foods) {
		logger.warn("[pairFoodsService.pairFoods] Foods not found");
		return;
	    }

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
		var foods = self.findAndPairFoods(foodsForPairs);

		if (foods.length >= 1 && oldFood && (Date.now() - foods[0].creation) >= config.app.demon.foodTimeout) {
		    foods.push(oldFood);
		    foods.sort(function (food1, food2) {if (food1 > food2) return -1; else return 1;});
		    self.findAndPairFoods(foods);
		}
	    });
	});
    },
    findAndPairFoods: function (foods) {
	if (!foods) {
	    return [];
	}

	for (var i = 0; i < foods.length; i++) {
	    var currentFood = foods[i];
	    var food = this.findFoodForUser(currentFood, foods);
	    if (food) {
		this.connectFoods(currentFood, food);
	    }
	}

	return foods;
    },
    findFoodForUser: function (food, foods) {
	logger.debug("Start findFoodForUser");
	for (var i = 0; i < foods.length; i++) {
	    if (food.user != foods[i].user) {
		return foods.splice(i, 1)[0];
	    }
	}
	return null;
    },
    connectFoods: function (food1, food2) {
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

	    logger.debug("Find user: ", user.email);
	    for (var i = 0; i < user.foods.length; i++) {
		if (!user.foods[i].stranger.user) {
		    logger.debug("Food for pairing found");
		    user.foods[i].stranger = food;
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

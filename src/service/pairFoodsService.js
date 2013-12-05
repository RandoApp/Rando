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
		    self.connectFoods(foodsForPairs);
		}
	    });
	});
    },
    connectFoods: function (foods) {
	logger.debug("----------------- Connect Foods: ", foods.length);
	for (var i = 0; i < foods.length; i+=2) {
	    var food1 = foods[i];
	    var food2 = foods[i+1];

	    userModel.getById(food1.user, function (err, user) {
		logger.debug("-----------------1 Find user: ", user.id);
		for (var j = 0; j < user.foods.length; j++) {
		    logger.debug("-----------------1 This is a paired food: ", user.email);
		    if (!user.foods[j].stranger.user) {
			logger.debug("-----------------1 YAHO. NOT PAIRED FOOD FIND. ");
			user.foods[j].stranger = food2;
			logger.debug("-----------------1 Ok. Try update user and remove food.");
			userModel.update(user);
			foodModel.remove(food2);
			return;
		    }
		}
	    });

	    userModel.getById(food2.user, function (err, user) {
		logger.debug("-----------------2 Find user: ", user.email);
		for (var j = 0; j < user.foods.length; j++) {
		    logger.debug("-----------------2 This is a paired food: ", user.id);
		    if (!user.foods[j].stranger.user) {
			logger.debug("-----------------2 YAHO. NOT PAIRED FOOD FIND. ");
			user.foods[j].stranger = food1;
			logger.debug("-----------------2 Ok. Try update user and remove food.");
			userModel.update(user);
			foodModel.remove(food1);
			return;
		    }
		}
	    });
	}
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

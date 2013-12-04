var logger = require("../log/logger");
var userModel = require("../model/userModel");
var foodModel = require("../model/foodModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    pairFoodDemonTimer: null,
    pairFoods: function () {
	foodModel.getAll(function (err, foods) {
	    if (err) {
		logger.warn("[pairFoodsService.pairFoods] Can't get all foods: ", err);
		return;
	    }

	    async.map(foods, function (food, callback) {
		if (food.creation) {
		}
	    }, function (err, result) {
	    });
	});
    },
    startPairFoodsDemon: function () {
	this.pairFoodDemonTimer = setInterval(this.pairFood, config.app.demon.wakeup);
    },
    stopPairFoodsDemon: function () {
	if (this.pairFoodDemonTimer) {
	    clearInterval(this.pairFoodDemonTimer);
	    this.pairFoodDemonTimer = null;
	}
    }
};

var userModel = require("../model/userModel");
var logger = require("../log/logger");
var async = require("async");
var mongoose = require("mongoose");
var Errors = require("../error/errors");

module.exports = {
    report: function (userId, foodId, callback) {
	logger.debug("[commentService.report, ", userId, "] Start report for food: ", foodId);
	async.waterfall([
	    function (done) {
		self.updateFood(userId, foodId, function (food) {
		    food.stranger.report = 1;
		}, function (err, food) {
		    done(null, food.stranger.user, food.stranger.foodId);
		});
	    },
	    function (strangerId, foodId, done) {
		self.updateFood(strangerId, foodId, function (food) {
		    food.user.report = 1;
		}, function () {
		    done();
		});
	    },
	], function (err) {
	    if (err) {
		logger.warn("[commentService.report, ", userId, "] Waterfall error: ", err);
		callback(err);
		return;
	    }
	    callback();
	});
    },
    bonAppetit: function (userId, foodId, callback) {
	logger.debug("[commentService.bonAppetit, ", userId, "] Start bonAppetit for food: ", foodId);
	var self = this;
	async.waterfall([
	    function (done) {
		self.updateFood(userId, foodId, function (food) {
		    food.stranger.bonAppetit = 1;
		}, function(err, food) {
		    done(null, food.stranger.user, food.stranger.foodId);
		});
	    },
	    function (strangerId, foodId, done) {
		self.updateFood(strangerId, foodId, function (food) {
		    food.user.bonAppetit = 1;
		}, function() {
		    done();
		});
	    },
	], function (err) {
	    if (err) {
		logger.warn("[commentService.bonAppetit, ", userId, "] Waterfall error: ", err);
		callback(err);
		return;
	    }
	    callback();
	});
    },
    updateFood: function (userId, foodId, updater, callback) {
	this.findUserWithFood(userId, foodId, function (err, user, food) {
	    if (err) {
		logger.debug("[commentService.updateFood, ", userId, "] Error, when run findUserWithFood. userId: ", userId, " foodId: ", foodId, " error: ", err);
		callback(err);
		return;
	    }

	    if (!user) {
		logger.warn("[commentService.updateFood, ", userId, "] User not found");
		callback(Errors.UserForReportNotFound());
		return;
	    }

	    logger.debug("[commentService.updateFood, ", userId, "] Trigger updater with food with id: ", foodId);
	    updater(food);

	    userModel.update(user);
	    callback(null, food);
	});
    },
    findUserWithFood: function (userId, foodId, callback) {
	userModel.getById(userId, function (err, user) {
	    if (err) {
		logger.warn("[commentService.findUserWithFood, ", userId, "] Can't find user by id: ", userId);
		callback(Errors.System(err));
		return;
	    }
	    if (!user) {
		logger.warn("[commentService.findUserWithFood, ", userId, "] User not found: ", userId);
		callback(Errors.UserForCommentNotFound());
		return;
	    }
	    if (!user.foods || user.foods.length == 0) {
		//TODO: change error
		logger.debug("[commentService.findUserWithFood, ", userId, "] User does not have food");
		callback(Errors.FoodForCommentNotFound());
		return;
	    }

	    logger.debug("[commentService.findUserWithFood, ", userId, "] Found user: ", user);

	    async.each(user.foods, function (food, done) {
		logger.debug("[commentService.findUserWithFood, ", userId, "] Next over iterate each food, food.stranger[", food.stranger.foodId, "] == foodId[", foodId ,"]"); 

		if (food.stranger && food.stranger.foodId == foodId) {
		    logger.debug("[commentService.findUserWithFood, ", userId, "] Found food: ", food.stranger);
		    callback(null, user);

		}
		logger.debug("[commentService.findUserWithFood, ", userId, "] Call async.each done");
		done();
	    }, function (err) {
		if (err) {
		    callback(Errors.System(err));
		    return;
		}

		callback(null, null);
	    });
	});
    }
};

var userModel = require("../model/userModel");
var logger = require("../log/logger");
var async = require("async");
var mongoose = require("mongoose");
var Errors = require("../error/errors");

//TODO: Service needs:
//1. userEmail and foodId verification in report and bonAppetit methods.
//2. Move verifications into the getByEmail (in report and bonAppetit) to Util verification function, because DRY.
module.exports = {
    report: function (userId, foodId, callback) {
	userModel.getById(userId, function (err, user) {
	    if (err) {
		logger.warn("Can't find user by id: ", userId);
		callback(Errors.System(err));
		return;
	    }
	    if (!user) {
		logger.warn("User not found: ", userId);
		callback(Errors.UserForReportNotFound());
		return;
	    }
	    if (!user.foods || user.foods.length == 0) {
		callback(Errors.FoodForReportNotFound());
	    }

	    async.each(user.foods, function (food, done) {
		if (food.stranger && food.stranger.food == foodId) {
		    food.stranger.report = true;
		    userModel.update(user);
		    callback();
		}
		done();
	    }, function (err) {
		if (err) {
		    logger.warn("Error when async iterate over foods: ", user.foods);
		}
	    });
	});
    },
    bonAppetit: function (userId, foodId, callback) {
	async.waterfall([
	    function (waterfall) {
		userModel.getById(userId, function (err, user) {
		    if (err) {
			logger.warn("Can't find user by id: ", userId);
			waterfall(Errors.System(err));
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", userId);
			waterfall(Errors.UserForBonAppetitNotFound());
			return;
		    }
		    if (!user.foods || user.foods.length == 0) {
			waterfall(Errors.FoodForBonAppetitNotFound());
		    }

		    //TODO: What if each function done and waterfall callback is not called?
		    async.each(user.foods, function (food, done) {
			if (food.stranger && food.stranger.food == foodId) {
			    food.stranger.bonAppetit = true;
			    userModel.update(user);
			    waterfall(null, food.stranger.strangerId, foodId);
			}
			done();
		    }, function (err) {
			if (err) {
			    logger.warn("Error when async iterate over foods: ", user.foods);
			}
		    });
		});
	    },
	    function (strangerId, foodId, waterfall) {
		userModel.getById(strangerId, function (err, user) {
		    if (err) {
			logger.warn("Can't find user by id: ", strangerId);
			waterfall(Errors.System(err));
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", strangerId);
			waterfall(Errors.UserForBonAppetitNotFound());
			return;
		    }
		    if (!user.foods || user.foods.length == 0) {
			waterfall(Errors.FoodForBonAppetitNotFound());
		    }

		    //TODO: What if each function done and waterfall callback is not called?
		    async.each(user.foods, function (food, done) {
			if (food.user && food.user.food == foodId) {
			    food.bonAppetit = true;
			    userModel.update(user);
			    waterfall(null);
			}
			done();
		    });
		});
	    }
	], function (err) {
	    if (err) {
		logger.warn("Waterfall error: ", err);
		callback(err);
		return;
	    }
	    callback();
	});
    }
};

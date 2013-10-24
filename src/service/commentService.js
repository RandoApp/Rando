var userModel = require("../model/userModel");
var logger = require("../log/logger");
var async = require("async");
var mongoose = require("mongoose");
var Errors = require("../error/errors");

//TODO: Service needs:
//1. userEmail and foodId verification in report and bonAppetit methods.
//2. Move verifications into the getByEmail (in report and bonAppetit) to Util verification function, because DRY.
module.exports = {
    report: function (userEmail, foodId, callback) {
	userModel.getByEmail(userEmail, function (err, user) {
	    if (err) {
		logger.warn("Can't find user by email: ", userEmail);
		callback(Errors.System(err));
		return;
	    }
	    if (!user) {
		logger.warn("User not found: ", userEmail);
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
    bonAppetit: function (userEmail, foodId, callback) {
	async.waterfall([
	    function (waterfall) {
		userModel.getByEmail(userEmail, function (err, user) {
		    if (err) {
			logger.warn("Can't find user by email: ", userEmail);
			waterfall(Errors.System(err));
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", userEmail);
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
			    waterfall(null, food.stranger.email, foodId);
			}
			done();
		    }, function (err) {
			if (err) {
			    logger.warn("Error when async iterate over foods: ", user.foods);
			}
		    });
		});
	    },
	    function (strangerEmail, foodId, waterfall) {
		userModel.getByEmail(strangerEmail, function (err, user) {
		    if (err) {
			logger.warn("Can't find user by email: ", userEmail);
			waterfall(Errors.System(err));
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", userEmail);
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

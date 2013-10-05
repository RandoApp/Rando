var userModel = require("../model/userModel");
var logger = require("../log/logger");
var async = require("async");
var mongoose = require("mongoose");

module.exports = {
    report: function (userEmail, foodId, callback) {
	userModel.getByEmail(userEmail, function (err, user) {
	    if (err) {
		logger.warn("Can't find user by email: ", userEmail);
		callback(err);
		return;
	    }
	    if (!user) {
		logger.warn("User not found: ", userEmail);
		callback(new Error("User not found"));
		return;
	    }
	    if (!user.foods || user.foods.length == 0) {
		callback(new Error("Foods not found"));
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
			waterfall(err);
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", userEmail);
			waterfall(new Error("User not found"));
			return;
		    }
		    if (!user.foods || user.foods.length == 0) {
			waterfall(new Error("Foods not found"));
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
			waterfall(err);
			return;
		    }
		    if (!user) {
			logger.warn("User not found: ", userEmail);
			waterfall(new Error("User not found"));
			return;
		    }
		    if (!user.foods || user.foods.length == 0) {
			waterfall(new Error("Foods not found"));
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

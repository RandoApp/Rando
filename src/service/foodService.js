var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var foodModel = require("../model/foodModel");
var userModel = require("../model/userModel");
var Errors = require("../error/errors");

module.exports =  {
    saveFood: function (userId, foodPath, location, callback) {
	logger.debug("[foodService.saveFood, ", userId, "] Try save food from: ", foodPath, " for: ", userId, " location: ", location);

	async.waterfall([
	    function (done) {
		if (!userId || !foodPath || !check(foodPath).notEmpty() || !location) {
		    logger.warn("[foodService.saveFood, ", userId, "] Incorect args. userId: ", userId, "; foodPath: ", foodPath, "; location: " , location);
		    done(Errors.IncorrectFoodArgs());
		    return;
		}
		done(null);
	    },
	    function (done) {
		util.generateFoodName(function (err, foodId, newFoodPath) {
		    if (err) {
			logger.warn("[foodService.saveFood, ", userId, "] Can't generateFoodName, because: ", err);
			done(Errors.System(err));
			return;
		    }
		    done(null, foodId, newFoodPath);
		});
	    },
	    function (foodId, newFoodPath, done) {
		logger.data("[foodService.saveFood, ", userId, "] move: ", foodPath, " --> ", newFoodPath);
		mv(foodPath, newFoodPath, {mkdirp: true}, function (err) {
		    if (err) {
			logger.warn("[foodService.saveFood, ", userId, "] Can't move  ", foodPath, " to ", newFoodPath, " because: ", err);
			done(Errors.System(err));
			return;
		    }
		    done(null, userId, foodId, newFoodPath, location);
		});
	    },
	    function (userId, foodId, newFoodPath, location, done) {
		logger.debug("Generate foodUrl");
		var foodUrl = config.app.url + config.app.static.folder.food + newFoodPath;
		done(null, userId, foodId, foodUrl, location);
	    },
	    this.updateFood
	], function (err) {
	    if (err) {
		logger.warn("[foodService.saveFood, ", userId, "] Can't save food, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("[foodService.saveFood, ", userId, "] save done");
	    callback();
	});
    },
    updateFood: function (userId, foodId, foodUrl, location, callback) {
	logger.debug("[foodService.updateFood, ", userId, "] Try update food for: ", userId, " location: ", location, " foodId: ", foodId, " and url: ", foodUrl);
	async.parallel({
		addFood: function (done) {
		    foodModel.add(userId, location, Date.now(), foodId, foodUrl, function (err) {
			if (err) {
			    logger.warn("[foodService.updateFood.addFood, ", userId, "] Can't add food because: ", err);
			    done(Errors.System(err));
			    return;
			}
			done(null);
		})},
		updateUser: function (done) {
		    var id = userId;
		    var foodId = foodId;
		    var foodUrl = foodUrl;
		    var location = location;
		    userModel.getById(userId, function (err, user) {
			if (err)  {
			    logger.warn("[foodService.updateFood.updateUser, ", userId, "] Can't find user: ", userId, " because: ", err);
			    done(Errors.System(err));
			    return;
			}

			user.foods.push({
			    user: {
				userId: id,
				location: location,
				foodId: foodId,
				foodUrl: foodUrl,
				mapUrl: "",
				bonAppetit: false
			    },
			    stranger: {
				strangerId: "",
				location: "",
				foodId: "",
				foodUrl: "",
				mapUrl: "",
				report: false,
				bonAppetit: false
			    }
			});

			logger.data("[foodService.updateFood.updateUser, ", userId, "] Try update user");
			userModel.update(user);
			done(null);
		    });
		}
	    },
	    function (err) {
		if (err) {
		    logger.debug("[foodService.updateFood, ", userId, "] asyn parallel get error: ", err);
		    callback(err);
		    return;
		}
		callback(null);
	    }
	);
    }
};

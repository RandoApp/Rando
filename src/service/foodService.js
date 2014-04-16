var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var foodModel = require("../model/foodModel");
var userModel = require("../model/userModel");
var mapService = require("./mapService");
var imageService = require("./imageService");
var Errors = require("../error/errors");
var gm = require("gm").subClass({ imageMagick: true });
var mkdirp = require("mkdirp");

module.exports =  {
    saveFood: function (user, foodPath, location, callback) {
	logger.debug("[foodService.saveFood, ", user.email, "] Try save food from: ", foodPath, " for: ", user.email, " location: ", location);

	async.waterfall([
	    function (done) {
		if (!foodPath || !check(foodPath).notEmpty() || !location) {
		    logger.warn("[foodService.saveFood, ", user.email, "] Incorect args. user: ", user.email, "; foodPath: ", foodPath, "; location: " , location);
		    done(Errors.IncorrectFoodArgs());
		    return;
		}
		logger.debug("[foodService.saveFood, ", user.email, "] args validation done");
		done(null);
	    },
	    function (done) {
		util.generateFoodName(done);
	    },
	    function (foodId, foodPaths, done) {
		var newFoodPath = config.app.static.folder.name + foodPaths.origin;
		logger.data("[foodService.saveFood, ", user.email, "] move: ", foodPath, " --> ", newFoodPath);
		mv(foodPath, newFoodPath, {mkdirp: true}, function (err) {
		    if (err) {
			logger.warn("[foodService.saveFood, ", user.email, "] Can't move  ", foodPath, " to ", newFoodPath, " because: ", err);
			done(Errors.System(err));
			return;
		    }

		    done(null, newFoodPath, foodPaths, user, foodId, location);
		});
	    },
	    function (foodPath, foodPaths, user, foodId, location, done) {
		logger.data("[foodService.saveFood, ", user.email, "] Try resize food images to small, medium and large sizes");

		async.parallel({
		    small: function (parallelCallback) {
			imageService.resize("small", foodPaths, foodId, foodPath, parallelCallback);
		    },
		    medium: function (parallelCallback) {
			imageService.resize("medium", foodPaths, foodId, foodPath, parallelCallback);
		    },
		    large: function (parallelCallback) {
			imageService.resize("large", foodPaths, foodId, foodPath, parallelCallback);
		    }
		}, function (err) {
		    if (err) {
			logger.error("[foodService.saveFood, ", user.email, "] Can not resize images because: ", err);
			done(err);
			return;
		    }
		    logger.debug("[foodService.saveFood, ", user.email, "] All images resized successfully. Go to next step");
		    done(null, foodPaths, user, foodId, location);
		});
	    },
	    function (foodPaths, user, foodId, location, done) {
		logger.debug("Generate foodUrl");
		var foodUrl = config.app.url + foodPaths.origin;
		var foodSizeUrl = {
		    small: config.app.url + foodPaths.small,
		    medium: config.app.url + foodPaths.medium,
		    large: config.app.url + foodPaths.large
		}
		done(null, user, foodId, foodUrl, foodSizeUrl, location);
	    },
	    this.updateFood
	], function (err, foodUrl) {
	    if (err) {
		logger.warn("[foodService.saveFood, ", user.email, "] Can't save food, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("[foodService.saveFood, ", user.email, "] save done");
	    callback(null, {foodUrl: foodUrl, creation: Date.now()});
	});
    },
    updateFood: function (user, foodId, foodUrl, foodSizeUrl, location, callback) {
	logger.debug("[foodService.updateFood, ", user.email, "] Try update food for: ", user.email, " location: ", location, " foodId: ", foodId, " url: ", foodUrl, " food url: ", foodSizeUrl);
	var mapUrl = mapService.locationToMapUrlSync(location.latitude, location.longitude);

	async.parallel({
		addFood: function (done) {
		    foodModel.add(user.id, location, Date.now(), foodId, foodUrl, foodSizeUrl, mapUrl, function (err) {
			if (err) {
			    logger.warn("[foodService.updateFood.addFood, ", user.email, "] Can't add food because: ", err);
			    done(Errors.System(err));
			    return;
			}
			done(null);
		})},
		updateUser: function (done) {
		    //TODO: Date.now in updateUser and addFood is differents. Use one time.
		    user.foods.push({
			user: {
			    user: user.id,
			    location: location,
			    foodId: foodId,
			    foodUrl: foodUrl,
			    foodSizeUrl: {
				small: foodSizeUrl.small,
				medium: foodSizeUrl.medium,
				large: foodSizeUrl.large 
			    },
			    mapUrl: mapUrl,
			    creation: Date.now(),
			    report: 0,
			    bonAppetit: 0
			},
			stranger: {
			    user: "",
			    location: {
				latitude: 0,
				longitude: 0
			    },
			    foodId: "",
			    foodUrl: "",
			    foodSizeUrl: {
				small: "",
				medium: "",
				large: ""
			    },
			    mapUrl: "",
			    creation: 0,
			    report: 0,
			    bonAppetit: 0
			}
		    });

		    logger.data("[foodService.updateFood.updateUser, ", user.email, "] Try update user");
		    userModel.update(user);
		    done(null, foodUrl);
		}
	    },
	    function (err, res) {
		if (err) {
		    logger.debug("[foodService.updateFood, ", user.email, "] asyn parallel get error: ", err);
		    callback(err);
		    return;
		}
		callback(null, res.updateUser);
	    }
	);
    }
};

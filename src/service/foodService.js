var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var foodModel = require("../model/foodModel");
var userModel = require("../model/userModel");
var mapService = require("./mapService");
var Errors = require("../error/errors");
var gm = require("gm");
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

		    async.parallel({
			small: function (parallelCallback) {
			    async.series({
				mkdir: function (seriesCallback) {
				    var dir = foodPaths.small.replace(new RegExp(foodId + "\..+$"), "");
				    
				    mkdirp(dir, seriesCallback);
				},
				resize: function (seriesCallback) {
				    var resizeFoodPath = config.app.static.folder.name + foodPaths.small;

				    gm(newFoodPath).resize(config.img.size.small).quality(config.img.quality).write(foodPaths, seriesCallback);
				}
			    },
			    function (err) {
				parallelCallback(err);
			    });
			},
			medium: function (parallelCallback) {
			    async.series({
				mkdir: function (seriesCallback) {
				    mkdirp(dir, seriesCallback);
				},
				resize: function (seriesCallback) {
				    gm(newFoodPath).resize(config.img.size.medium).quality(config.img.quality).write(path, seriesCallback);
				}
			    },
			    function (err) {
				parallelCallback(err);
			    });
			},
			large: function (parallelCallback) {
			    async.series({
				mkdir: function (seriesCallback) {
				    mkdirp(dir, seriesCallback);
				},
				resize: function (seriesCallback) {
				    gm(newFoodPath).resize(config.img.size.large).quality(config.img.quality).write(path, seriesCallback);
				}
			    },
			    function (err) {
				parallelCallback(err);
			    });
			},
		    }, function (err) {
			done(null, {
			    }, user, foodId, foodName, location);
		    });
		});
	    },
	    function (user, foodId, foodName, location, done) {
		logger.debug("Generate foodUrl");
		var foodUrl = config.app.url + foodName;
		done(null, user, foodId, foodUrl, location);
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
    updateFood: function (user, foodId, foodUrl, location, callback) {
	logger.debug("[foodService.updateFood, ", user.email, "] Try update food for: ", user.email, " location: ", location, " foodId: ", foodId, " and url: ", foodUrl);
	var mapUrl = mapService.locationToMapUrlSync(location.latitude, location.longitude);

	async.parallel({
		addFood: function (done) {
		    foodModel.add(user.id, location, Date.now(), foodId, foodUrl, mapUrl, function (err) {
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
			    mapUrl: config.app.mapStub,
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

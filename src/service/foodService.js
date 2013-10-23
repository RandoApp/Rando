var logger = require("../log/logger");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var foodModel = require("../model/foodModel");
var userModel = require("../model/userModel");

module.exports =  {
    saveFood: function (userId, foodPath, location, callback) {
	logger.debug("Try save food from: ", foodPath, " for: ", userId, " location: ", location);

	async.waterfall([
	    function (done) {
		if (!userId || !foodPath || !check(foodPath).notEmpty() || !location) {
		    logger.warn("Incorect args: ", userId, foodPath, location);
		    done(new Error("Incorect args"));
		    return;
		}
		done(null);
	    },
	    function (done) {
		util.generateFoodName(function (err, name) {
		    if (err) {
			done(err);
			return;
		    }
		    done(null, name);
		});
	    },
	    function (name, done) {
		logger.debug("move: ", foodPath, " --> ", name);
		mv(foodPath, name, {mkdirp: true}, function (err) {
		    if (err) {
			logger.warn("Can't move  ", foodPath, " to ", name);
			done(err);
			return;
		    }
		    done(null, userId, name, location);
		});
	    },
	    this.updateFood
	], function (err) {
	    if (err) {
		logger.warn("Can't save food, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("saveFood done");
	    callback();
	});
    },
    updateFood: function (userId, name, location, callback) {
	async.parallel({
		addFood: function (done) {
		    foodModel.add(userId, location, Date.now(), name, function (err) {
			if (err) {
			    logger.warn("Can't add food");
			    done(err);
			    return;
			}
			done(null);
		})},
		updateUser: function (done) {
		    var id = userId;
		    var name = name;
		    var location = location;
		    userModel.getById(userId, function (err, user) {
			if (err)  {
			    logger.warn("Can't find user: ", userId, " because: ", err);
			    done(err);
			    return;
			}

			user.foods.push({
			    user: {
				email: user.email,
				location: location,
				food: name,
				map: "",
				bonAppetit: false
			    },
			    stranger: {
				email: "",
				location: "",
				food: "",
				map: "",
				report: false,
				bonAppetit: false
			    }
			});

			userModel.update(user);
			done(null);
		    });
		}
	    },
	    function (err) {
		if (err) {
		    callback(err);
		    return;
		}
		callback(null);
	    }
	);
    }
};

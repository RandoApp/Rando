var logger = require("../log/logger");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var foodModel = require("../model/foodModel");
var userModel = require("../model/userModel");

module.exports =  {
    saveFood: function (foodPath, callback) {
	logger.debug("Try save food from: ", foodPath);

	async.waterfall([
	    function (done) {
		if (!foodPath || !check(foodPath).notEmpty()) {
		    logger.warn("Incorect food path: ", foodPath);
		    done(new Error("Incorect food path"));
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
		    done(null, name);
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
    updateFood: function (name, callback) {
	async.parallel({
		addFood: function (done) {
		    foodModel.add(email, location, creation, name, map, function (err) {
			if (err) {
			    logger.warn("Can't add food");
			    done(err);
			    return;
			}
			done(null);
		})},
		updateUser: function (done) {
		    userModel.getUserByEmail();
		    userModel.update();
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

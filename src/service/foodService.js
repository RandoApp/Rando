var logger = require("../log/logger");
var userModel = require("../model/userModel");
var async = require("async");
var check = require("validator").check;
var fs = require("fs");
var config = require("config");
var util = require("../util/util");
var mv = require("mv");

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
		logger.debug("move: " + foodPath + " --> " + name);
		mv(foodPath, name, {mkdirp: true}, function (err) {
		    if (err) {
			logger.warn("Can't move  ", foodPath, " to ", name);
			done(err);
			return;
		    }
		    done(null);
		});
	    }
	], function (err) {
	    if (err) {
		logger.warn("Can't save food, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("saveFood done");
	    callback();
	});
    }
};

var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var Errors = require("../error/errors");
//var gm = require("gm").subClass({ imageMagick: true });
var gm = require("gm");
var mkdirp = require("mkdirp");

module.exports =  {
    resize: function (size, foodPaths, foodId, foodPath, callback) {
	logger.data("[imageService.resize] Try resize image to size: ", size, " image path: ", foodPath, " foodPaths: ", foodPaths, " foodId: ", foodId);

	async.series({
	    mkdir: function (done) {
		var dir = foodPaths[size].replace(new RegExp(foodId + "\..+$"), "");
		logger.debug("[imageService.resize.mkdir] mkdirp for path: ", dir);
		mkdirp(dir, function (err, made) {
		    if (err || made == null) {
			logger.error("[imageService.resize.mkdir] Can not mkdir for path ", dir, " err: ", err, " made: ", made);
			done(new Error("Can not mkdir " + dir));
			return;
		    }
		    logger.debug("[imageService.resize.mkdir] mkdirp for ", made, " done successfully");
		    done();
		});
	    },
	    resize: function (done) {
		logger.debug("[imageService.resize.resize] gm.resize.quality.write");
		var originFoodPath = config.app.static.folder.name + foodPaths.origin;
		var sizeFoodPath = config.app.static.folder.name + foodPaths[size];
		logger.debug("[imageService.resize.resize] Try resize image with options: originalFoodPath: ", originFoodPath, "destination food image: ", sizeFoodPath);
		gm(originFoodPath).resize(config.app.img.size[size]).quality(config.app.img.quality).write(sizeFoodPath, function (err) {
		    if (err) {
			logger.error("[imageService.resize.resize] gm.resize.quality.write done with error: ", err);
			done(err);
			return;
		    } 

		    logger.error("[imageService.resize.resize] gm.resize.quality.write done successfully");
		    done();
		});
	    }
	},
	function (err) {
	    if (err) {
		logger.error("[imageService.resize] Can not resize image, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("[imageService.resize] Food image resized successfully");
	    callback();
	});
    }
};

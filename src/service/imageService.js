var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var Errors = require("../error/errors");
var gm = require("gm").subClass({ imageMagick: true });
var mkdirp = require("mkdirp");

module.exports =  {
    resize: function (size, imagePaths, randoId, imagePath, callback) {
	logger.data("[imageService.resize] Try resize image to size: ", size, " image path: ", imagePath, " imagePaths: ", imagePaths, " randoId: ", randoId);

	async.series({
	    mkdir: function (done) {
		var dir = config.app.static.folder.name + imagePaths[size].replace(new RegExp(randoId + "\..+$"), "");
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
		var originImagePath = config.app.static.folder.name + imagePaths.origin;
		var sizeImagePath = config.app.static.folder.name + imagePaths[size];
		logger.debug("[imageService.resize.resize] Try resize image with options: originalFoodPath: ", originImagePath, "destination image: ", sizeImagePath);
		gm(originImagePath).resize(config.app.img.size[size]).quality(config.app.img.quality).write(sizeImagePath, function (err) {
		    if (err) {
			logger.error("[imageService.resize.resize] gm.resize.quality.write done with error: ", err);
			done(err);
			return;
		    } 

		    logger.debug("[imageService.resize.resize] gm.resize.quality.write done successfully");
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

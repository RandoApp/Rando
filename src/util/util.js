var config = require("config");
var crypto = require("crypto");
var fs = require("fs");
var async = require("async");
var logger = require("../log/logger");

module.exports = {
    generateFoodName: function (callback) {
	logger.debug("[util.genereateFoodName]");
	async.waterfall([
	    this.generateUniqueName,
	    function (name, done) {
		var folderName = name.substr(0, config.app.static.folder.length);
		var foodPaths = {
		    origin: config.app.static.folder.food + folderName + "/" + name + "." + config.app.static.file.ext,
		    small: config.app.static.folder.food + config.app.img.folder.small + folderName + "/" + name + "." + config.app.img.ext,
		    medium: config.app.static.folder.food + config.app.img.folder.medium + folderName + "/" + name + "." + config.app.img.ext,
		    large: config.app.static.folder.food + config.app.img.folder.large + folderName + "/" + name + "." + config.app.img.ext
		}
		logger.debug("foodPaths: ", foodPaths);
		done(null, name, foodPaths);
	    }],
	    function (err, name, foodPaths) {
		if (err) {
		    logger.warn("genereFoodName fail with error: ", err);
		    callback(err);
		    return;
		}

		callback(null, name, foodPaths);
	    });
    },
    generateUniqueName: function (callback) {
	logger.debug("[util.generateUniqueName]");
	crypto.pseudoRandomBytes(config.app.static.file.length, function(ex, buf) {
	    if (ex) {
		logger.warn("Can't genererateUniqueName: ", ex);
		callback(ex);
		return;
	    }

	    logger.debug("Unique name generated successful");

	    callback(null, buf.toString('hex'));
	});
    }
};


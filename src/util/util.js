var config = require("config");
var crypto = require("crypto");
var fs = require("fs");
var async = require("async");
var logger = require("../log/logger");

module.exports = {
    generateImageName: function (callback) {
	logger.debug("[util.generateImageName]");
	async.waterfall([
	    this.generateUniqueName,
	    function (name, done) {
		var folderName = name.substr(0, config.app.static.folder.length);
		var imagePaths = {
		    origin: config.app.static.folder.image + config.app.img.folder.origin + folderName + "/" + name + "." + config.app.img.ext,
		    small: config.app.static.folder.image + config.app.img.folder.small + folderName + "/" + name + "." + config.app.img.ext,
		    medium: config.app.static.folder.image + config.app.img.folder.medium + folderName + "/" + name + "." + config.app.img.ext,
		    large: config.app.static.folder.image + config.app.img.folder.large + folderName + "/" + name + "." + config.app.img.ext
		}
		logger.debug("imagePaths: ", imagePaths);
		done(null, name, imagePaths);
	    }],
	    function (err, name, imagePaths) {
		if (err) {
		    logger.warn("genereImageName fail with error: ", err);
		    callback(err);
		    return;
		}

		callback(null, name, imagePaths);
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


var config = require("config");
var crypto = require("crypto");
var fs = require("fs");
var async = require("async");
var logger = require("../log/logger");

module.exports = {
    generateFoodName: function (callback) {
	async.waterfall([
	    this.generateUniqueName,
	    function (name, done) {
		var folderName = name.substr(0, config.app.static.folder.length);
		var fullPath = config.app.static.folder.food + "/" + folderName + "/" + name + "." + config.app.static.file.ext;

		logger.debug("fullPath: ", fullPath);
		done(null, fullPath);
	    }],
	    function (err, fullPath) {
		if (err) {
		    logger.warn("genereFoodName fail with error: ", err);
		    callback(err);
		    return;
		}

		callback(null, fullPath);
	    });
    },
    generateUniqueName: function (callback) {
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


var fs = require("fs");
var logger = require("../log/logger");
var Errors = require("../error/errors");
var crypto = require("crypto");
var config = require("config");

module.exports = {
	storeLog: function (email, log, callback) {
		var logName = this.generateLogName(email);
		fs.writeFile(logName, JSON.stringify(log), function (err) {
			if (err) {
				callback(Errors.System(err));
				return;
			}
			callback(null, {command: "log", result: "done"});
		});
	},
	generateLogName: function (email) {
		var unique = crypto.randomBytes(3).toString("hex");
		var date = Date.now();
		return config.app.log.folder + "/" + email + "_" + date + "_" + unique + ".log";
	}
};

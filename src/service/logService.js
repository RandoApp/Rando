var fs = require("fs");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
    storeLog: function (email, log, callback) {
	var logName = this.generateLogName(email);
	fs.writeFile(logName, log, function (err) {
	    if (err) {
		callback(Errors.System(err));
		return;
	    }
	    callback(null, {command: "log", result: "done"});
	});
    },
    generateLogName: function (email) {
	var date = Date.now();
	return email + date + ".log";
    }
};

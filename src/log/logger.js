var config = require("config");

module.exports = {
    getLogger: function () {
	var logger = require("winston");

	logger.exitOnError = false;
	logger.add(logger.transports.File, {
	    filename: config.app.log.file,
	    handleException: config.app.log.handleException
	});

	return logger;
    }
};

var config = require("config");
var winston = require("winston");

module.exports = new (winston.Logger)({
    transports: [
	new (winston.transports.Console)({level: config.app.log.level.console, colorize: true, timestamp: true}),
	new (winston.transports.File)({
	    filename: config.app.log.file,
	    handleException: config.app.log.handleException,
	    level: config.app.log.level.file,
	    timestamp: true
	})],
    levels: { error: 0, warn: 1, data: 2, info: 3, debug: 4, trace: 5 },
    colors: { error: "red", warn: "yellow", data: "blue", info: "green", debug: "grey", trace: "cyan" },
    exitOnError: false
});

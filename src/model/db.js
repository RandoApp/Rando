var logger = require("../log/logger");
var config = require("config");
var mongoose = require("mongoose");

module.exports = {
    establishConnection: function () {
	mongoose.connect(config.db.url);
	var db = mongoose.connection;

	db.on("error", function (e) {
	    logger.error("Monodb connection error: " + e);
	});

	db.on("open", function () {
	    logger.info("Connection to mongodb established");
	});
	return db;
    }
};

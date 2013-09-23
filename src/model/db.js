var logger = require("../log/logger");

module.exports = {
    establishConnection: function () {
	var mongoose = require("mongoose");
	var config = require("config");

	mongoose.connect(config.db.url);

	var db = mongoose.connection;

	db.on("error", function (e) {
	    logger.error("Monodb connection error: " + e);
	});

	db.on("open", function () {
	    logger.info("Connection to mongodb established");
	});
    }
};

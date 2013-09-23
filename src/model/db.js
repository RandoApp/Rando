module.exports = {
    establishConnection: function () {
	var mongoose = require("mongoose");
	var config = require("config");

	mongoose.connect(config.db.url);

	var db = mongoose.connection;

	db.on("error", function (e) {
	    console.log("Monodb connection error: " + e);
	});

	db.on("open", function () {
	    console.log("Connection to mongodb established");
	});
    }
};

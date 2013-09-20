var mongoose = require('mongoose');
var config = require("config");

mongoose.connect(config.db.url);

var db = mongoose.connection;

db.on("error", function () {
    console.log("error");
});

db.on("open", function () {
    console.log("open");
});


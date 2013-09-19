var mongoose = require('mongoose');
var CONFIG = require("config");

mongoose.connect(CONFIG.db.url);

var db = mongoose.connection;

db.on("error", function () {
});

db.on("open", function () {
});

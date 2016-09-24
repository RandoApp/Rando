var mongoose = require("mongoose");
var winston = require("winston");
var config = require("config");
var dbMigration = require("./1.0.14-1.0.15/dbMigration");

var db = {
  connect (callback) {
    mongoose.connect(config.db.url);
    var db = mongoose.connection;

    db.on("error", function (e) {
      winston.error("Monodb connection error: " + e);
    });

    db.on("open", function () {
      winston.info("Connection to mongodb established");
      callback();
    });
    return db;
  },
  disconnect () {
    mongoose.disconnect();
    winston.info("Connections to mongodb closed");
  }
};

db.connect(function () {
  dbMigration.run();
  db.disconnect();
});

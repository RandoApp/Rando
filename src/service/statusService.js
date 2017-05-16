var Db = require("mongodb").Db;
var Server = require("mongodb").Server;
var async = require("async");
var fs = require("fs");
var exec = require("child_process").exec;
var http = require("http");
var config = require("config");

module.exports = {
  status: function (callback) {
    async.parallel([
      dbStatus,
      s3Status,
      componentsStatus,
      fsStatus
      ], function (err, statuses) {
        var status = {created: new Date()};

        for (var i = 0; i < statuses.length; i++) {
          for (var attr in statuses[i]) {
            status[attr] = statuses[i][attr];
          }
        }
        callback(status);
      });
  }
};

function dbStatus (callback) {
  var db = new Db(config.db.name, new Server(config.db.host, config.db.port), {safe: true});
  db.open(function(err, db) {
    if (err) {
      callback(null, {db: "fail"});
      return;
    }

    db.admin().serverStatus(function (err, info) {
      if (err || info.ok != 1) {
        callback(null, {db: "fail"});
      } else {
        callback(null, {db: "ok"});
      }
      db.close();
    });
  });
}

function componentsStatus (callback) {
  exec("convert -version", function (err, stdout, stderr) {
    if (err || stderr) {
      callback(null, {components: "fail"});
      return;
    }
    callback(null, {components: "ok"});
  });
}

function fsStatus (callback) {
  var fileName = "/tmp/rando-status-test" + Date.now() + ".txt";
  async.series({
    canWrite: function (done) {
      fs.writeFile(fileName, "Check fs status", done);
    },
    canRead: function (done) {
      fs.readFile(fileName, function (err, data) {
        if (err || data != "Check fs status") {
          done(new Error("Can not read file"));
          return;
        }
        done();
      });
    },
    canDelete: function (done) {
      fs.unlink(fileName, done);
    }
  }, function (err) {
    if (err) {
      callback(null, {fs: "fail"});
    } else {
      callback(null, {fs: "ok"});
    }
  });
}

function s3Status (callback ) {
  http.get("http://s3.amazonaws.com/img.s.rando4me/reported.jpg", function (res) {
    if (res.statusCode === 200) {
      callback(null, {s3: "ok"});
    } else {
      callback(null, {s3: "fail"});
    }
  })
}

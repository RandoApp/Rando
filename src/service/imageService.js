var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var Errors = require("../error/errors");
var gm = require("gm");
var mkdirp = require("mkdirp");

module.exports =  {
    resize: function (size, foodPaths, foodId, foodPath, callback) {
	async.series({
	    mkdir: function (done) {
		var dir = foodPaths[size].replace(new RegExp(foodId + "\..+$"), "");
		mkdirp(dir, function (err, made) {
		    if (err || made == null) {
			done(new Error("Can not mkdir " + dir));
			return;
		    }
		    done();
		});
	    },
	    resize: function (done) {
		var originFoodPath = config.app.static.folder.name + foodPaths.origin;
		var sizeFoodPath = config.app.static.folder.name + foodPaths[size];
		gm(originFoodPath).resize(config.app.img.size[size]).quality(config.app.img.quality).write(sizeFoodPath, done);
	    }
	},
	function (err) {
	    callback(err);
	});
    }
};

var logger = require("../log/logger");
var userModel = require("../model/userModel");
var randoModel = require("../model/randoModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    timer: null,
    pair: function () {
	var self = this;
	randoModel.getAll(function (err, randos) {
	    if (err) {
		logger.warn("[pairImagesService.pairImages] Can't get all randos: ", err);
		return;
	    }

            if (randos) {
                for (var i = 0; i < randos.length; i++) {
                    var currentRando = randos[i];
                    var rando = self.findRandoForUser(currentRando.email, randos);
                    if (rando) {
                        self.connectRandos(currentRando, rando);
                    }
                }
            }
	});
    },
    findRandoForUser: function (email, randos) {
	for (var i = 0; i < randos.length; i++) {
	    if (email != randos[i].email) {
		return randos.splice(i, 1)[0];
	    }
	}
	return null;
    },
    connectRandos: function (rando1, rando2, callback) {
        var self = this;
        async.parallel({
            rando2ToUser1: function (done) {
                self.randoToUser(rando1.email, rando2, done);
            },
            rando1ToUser2: function (done) {
                self.randoToUser(rando2.email, rando1, done);
            },
        }, function (err) {
            if (err) {
                logger.warn("Can't porcess rando for users ", rando1.email, " and ", rando2.email, ", because: ", err);
            }
            callback(err);
        });
    },
    randoToUser: function (email, rando, callback) {
        var self = this;
	userModel.getByEmail(email, function (err, user) {
	    if (err) {
		logger.warn("Data base error when getByEmail: ", email);
		return;
	    }

	    if (!user) {
		logger.warn("User not found: ", email);
		return;
	    }

            async.detect(user.randos, function (userRando, detectDone) {
                detectDone(!userRando.stranger.email);
            }, function (userRando) {
                if (userRando) {
                    userRando.stranger = rando;
                    self.updateModels(user, rando, callback);
                } else {
                    logger.warn("Not found empty rando for pairing for user: ", email);
                    callback();
                }
            });
	});
    },
    updateModels: function (user, rando, callback) {
        async.parallel({
            rmRando: function (done) {
                randoModel.remove(rando, done);
            },
            updateUser: function (done) {
                userModel.update(user, done);
            }
        }, function (err) {
            if (err) {
                logger.warn("Can't remove rando or/and update user, because: ", err);
            } 
            callback(err);
        });
    },
    startDemon: function () {
	logger.info("Start pair randos demon with interval wakeup: ", config.app.demon.wakeup);
	var self = this;
	this.timer = setInterval(function () {
	    self.pair();
	}, config.app.demon.wakeup);
    },
    stopDemon: function () {
	if (this.timer) {
	    logger.info("Stop pair randos demon");
	    clearInterval(this.timer);
	    this.timer = null;
	}
    }
};

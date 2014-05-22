var logger = require("../log/logger");
var userModel = require("../model/userModel");
var randoModel = require("../model/randoModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    timer: null,
    pair: function (callback) {
	var self = this;
	randoModel.getAll(function (err, randos) {
	    if (err) {
		logger.warn("[pairImagesService.pairImages] Can't get all randos: ", err);
                callback(err);
		return;
	    }

            if (!randos) {
                callback(new Error("Randos not found"));
                return;
            }


            var randosWithStatus = self.wrapRandosWithStatusSync(randos);
            async.eachSeries(randosWithStatus, function (randoWithStatus, done) {
                var randoToPair = self.findRandoForUserSync(randoWithStatus, randosWithStatus);
                if (randoToPair) {
                    self.connectRandos(randoWithStatus.rando, randoToPair, function () {
                        done();
                    });
                } else {
                    done();
                }
            }, function (err) {
                callback(err);
            });
	});
    },
    wrapRandosWithStatusSync: function (randos) {
        var randosWithStatus = [];
        for (var i = 0; i < randos.length; i++) {
            randosWithStatus.push({
                status: "pairing",
                rando: randos[i]
            });
        }
        return randosWithStatus;
    },
    findRandoForUserSync: function (randoWithStatus, randosWithStatus) {
        var PAIRED_STATUS = "paired";
        if (randoWithStatus.status != PAIRED_STATUS) {
            for (var i = 0; i < randosWithStatus.length; i++) {
                if (randoWithStatus.rando.email != randosWithStatus[i].rando.email && randosWithStatus[i].status != PAIRED_STATUS) {
                    randoWithStatus.status = PAIRED_STATUS;
                    randosWithStatus[i].status = PAIRED_STATUS;
                    return randosWithStatus[i].rando;
                }
            }
        }
	return null;
    },
    connectRandos: function (rando1, rando2, callback) {
        logger.debug("[pairService.connectRandos] Pair:", rando1.email, " <--> ", rando2.email);
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
                logger.warn("Can't connect randos for users ", rando1.email, " and ", rando2.email, ", because: ", err);
            }
            callback(err);
        });
    },
    randoToUser: function (email, rando, callback) {
        var self = this;
	userModel.getByEmail(email, function (err, user) {
	    if (err) {
		logger.warn("Data base error when getByEmail: ", email);
                callback(err);
		return;
	    }

	    if (!user) {
		logger.warn("User not found: ", email);
                callback(new Error("User not found"));
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
	    self.pair(function (err) {/*Pair done. Ok. Ignore.*/});
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

var logger = require("../log/logger");
var userModel = require("../model/userModel");
var randoModel = require("../model/randoModel");
var config = require("config");
var Errors = require("../error/errors");
var async = require("async");

module.exports = {
    timer: null,
    pairImages: function () {
	logger.debug("PairRandosDemon start work");
	var self = this;
	randoModel.getAll(function (err, randos) {
	    if (err) {
		logger.warn("[pairImagesService.pairImages] Can't get all randos: ", err);
		return;
	    }

	    if (!randos) {
		logger.warn("[pairImagesService.pairImages] Randos not found");
		return;
	    }

	    var oldRando = null;
	    async.filter(randos, function (rando, callback) {
		if (rando.creation) {
		    callback(true);
		    return;
		} else if (!oldRando) {
		    oldRando = rando;
		} 
		callback(false);
	    }, function (randosForPairs) {
		var randos = self.findAndPairRandos(randosForPairs);

		if (randos.length >= 1 && oldRando && (Date.now() - randos[0].creation) >= config.app.demon.pairingTimeout) {
		    randos.push(oldRando);
		    randos.sort(function (rando1, rando2) {if (rando1 > rando2) return -1; else return 1;});
		    self.findAndPairRandos(randos);
		}
	    });
	});
    },
    findAndPairRandos: function (randos) {
	if (!randos) {
	    return [];
	}

	for (var i = 0; i < randos.length; i++) {
	    var currentRando = randos[i];
	    var rando = this.findRandoForUser(currentRando, randos);
	    if (rando) {
		this.connectRandos(currentRando, rando);
	    }
	}

	return randos;
    },
    findRandoForUser: function (rando, randos) {
	logger.debug("Start findRandoForUser");
	for (var i = 0; i < randos.length; i++) {
	    if (rando.user != randos[i].user) {
		return randos.splice(i, 1)[0];
	    }
	}
	return null;
    },
    connectRandos: function (rando1, rando2) {
	this.processRandoForUser(rando1.user, rando2);
	this.processRandoForUser(rando2.user, rando1);
    },
    processRandoForUser: function (userId, rando) {
	logger.debug("Try find user by id: ", userId);
	userModel.getById(userId, function (err, user) {
	    if (err) {
		logger.warn("Data base error when getById: ", userId);
		return;
	    }

	    if (!user) {
		logger.warn("User not found: ", userId);
		return;
	    }

	    logger.debug("Find user: ", user.email);
	    for (var i = 0; i < user.randos.length; i++) {
		if (!user.randos[i].stranger.user) {
		    logger.debug("Rando for pairing found");
		    user.randos[i].stranger = rando;
		    userModel.update(user);
		    randoModel.remove(rando);
		    return;
		}
	    }
	});
    },
    startDemon: function () {
	logger.info("Start pair randos demon with interval wakeup: ", config.app.demon.wakeup);
	var self = this;
	this.timer = setInterval(function () {
	    self.pairImages();
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

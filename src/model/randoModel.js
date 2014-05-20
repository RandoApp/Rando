var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Rando = mongoose.model("rando", new mongoose.Schema({
    email: String,
    location: {
	latitude: Number,
	longitude: Number
    },
    creation: Number,
    randoId: String,
    imageURL: String,
    imageSizeURL: {
	small: String,
	medium: String,
	large: String
    },
    mapURL: String,
    mapSizeURL: {
	small: String,
	medium: String,
	large: String
    },
    report: Number
}));

module.exports = {
    add: function (params, callback) {
	logger.data("[randoModel.add] Rando add. ", params);
	var rando = new Rando(params);
	rando.save(callback);
    },
    getAll: function (callback) {
	logger.data("[randoModel.getAll]");
	Rando.find({}, callback);
    },
    remove: function (rando, callback) {
	logger.data("[randoModel.remove] Try remove rando");
	rando.remove(function (err) {
	    if (err) {
		logger.warn("[randoModel.remove] Can't remove rando, because: ", err); 
	    } else {
                logger.debug("[randoModel.remove] Rando removed. User: ", rando.email," randoId: ", rando.randoId);
            }

            if (callback) {
                callback(err);
            }
	});
    },
    update: function (rando, callback) {
	logger.data("[randoModel.update] Update rando: ", rando.email, " randoId: ", rando.randoId);
	rando.save(function (err) {
		if (err) {
		    logger.warn("[randoModel.update] Can't update rando " , rando.randoId, " because: ", err);
		} else {
                    logger.debug("[randoModel.update] Rando ", rando.randoId, " updated");
                }

                if (callback) {
                    callback(err);
                }
	});
    }
}

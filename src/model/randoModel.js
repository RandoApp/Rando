var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var Rando = mongoose.model("rando", new mongoose.Schema({
    user: String,
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
    report: Number,
    bonAppetit: Number
}));

module.exports = {
    add: function (userId, location, creation, randoId, imageURL, imageSizeURL, mapSizeURL, callback) {
	logger.data("[randoModel.add] Rando add. User: ", userId, " , location: ", location, ", creation: ", creation, ", randoId: ", randoId, "imageURL: ", imageURL,  " imageSizeURL: ", imageSizeURL, "mapSizeURL: ", mapSizeURL);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("[randoModel.add] Can't add rando! User: ", userId, " location: ", location, " creation: ", creation, " randoId: ", randoId, "imageURL: ", imageURL, "imageSizeURL: " , imageSizeURL, "mapSizeURL: ", mapSizeURL, " , because: ", err);
 		    return;
		}
		logger.debug("[randoModel.add] Rando added. User: ", userId, " location: ", location, " creation: ", creation, "randoId: ", randoId, " imageURL: ", imageURL, " imageSizeURL: ", imageSizeURL, "mapSizeURL: ", mapSizeURL);
	    }
	}

	var rando = new Rando({
	    user: userId,
	    location: location,
	    creation: creation,
	    randoId: randoId,
	    bonAppetit: 0,
	    report: 0,
	    imageURL: imageURL,
	    imageSizeURL: {
		small: imageSizeURL.small,
		medium: imageSizeURL.medium,
		large: imageSizeURL.large
	    },
	    mapURL: mapSizeURL.large,
	    mapSizeURL: {
		small: mapSizeURL.small,
		medium: mapSizeURL.medium,
		large: mapSizeURL.large
	    }
	});

	rando.save(callback);
    },
    getAll: function (callback) {
	logger.data("[randoModel.getAll]");
	Rando.find({}, callback);
    },
    remove: function (rando) {
	logger.data("[randoModel.remove] Try remove rando");
	rando.remove(function (err) {
	    if (err) {
		logger.warn("[randoModel.remove] Can't remove rando, because: ", err); 
		return;
	    }
	    logger.debug("[randoModel.remove] Rando removed. User: ", rando.user, " location: ", rando.location, "creation: ", rando.user.creation, " randoId: ", rando.randoId, " imageURL: ", rando.imageURL, "mapURL: ", rando.mapURL);
	});
    },
    update: function (rando, callback) {
	logger.data("[randoModel.update] Update rando: ", rando.randoId);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("[randoModel.update] Can't update rando " , rando.randoId, " because: ", err);
		    return;
		}

		logger.debug("[randoModel.update] Rando ", rando.randoId, " updated");
	    };
	}

	rando.save(callback);
    }
}

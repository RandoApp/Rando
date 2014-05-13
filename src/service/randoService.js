var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var check = require("validator").check;
var util = require("../util/util");
var mv = require("mv");
var randoModel = require("../model/randoModel");
var userModel = require("../model/userModel");
var mapService = require("./mapService");
var imageService = require("./imageService");
var Errors = require("../error/errors");
var gm = require("gm").subClass({ imageMagick: true });
var mkdirp = require("mkdirp");

module.exports =  {
    saveImage: function (user, imagePath, location, callback) {
	logger.debug("[randoService.saveImage, ", user.email, "] Try save image from: ", imagePath, " for: ", user.email, " location: ", location);

	async.waterfall([
	    function (done) {
		if (!imagePath || !check(imagePath).notEmpty() || !location) {
		    logger.warn("[randoService.saveImage, ", user.email, "] Incorect args. user: ", user.email, "; imagePath: ", imagePath, "; location: " , location);
		    done(Errors.IncorrectArgs());
		    return;
		}
		logger.debug("[randoService.saveImage, ", user.email, "] args validation done");
		done(null);
	    },
	    function (done) {
		util.generateImageName(done);
	    },
	    function (randoId, imagePaths, done) {
		var newRandoPath = config.app.static.folder.name + imagePaths.origin;
		logger.data("[randoService.saveImage, ", user.email, "] move: ", imagePath, " --> ", newRandoPath);
		mv(imagePath, newRandoPath, {mkdirp: true}, function (err) {
		    if (err) {
			logger.warn("[randoService.saveImage, ", user.email, "] Can't move  ", imagePath, " to ", newRandoPath, " because: ", err);
			done(Errors.System(err));
			return;
		    }

		    done(null, newRandoPath, imagePaths, user, randoId, location);
		});
	    },
	    function (imagePath, imagePaths, user, randoId, location, done) {
		logger.data("[randoService.saveImage, ", user.email, "] Try resize images to small, medium and large sizes");

		async.parallel({
		    small: function (parallelCallback) {
			imageService.resize("small", imagePaths, randoId, imagePath, parallelCallback);
		    },
		    medium: function (parallelCallback) {
			imageService.resize("medium", imagePaths, randoId, imagePath, parallelCallback);
		    },
		    large: function (parallelCallback) {
			imageService.resize("large", imagePaths, randoId, imagePath, parallelCallback);
		    }
		}, function (err) {
		    if (err) {
			logger.error("[randoService.saveImage, ", user.email, "] Can not resize images because: ", err);
			done(err);
			return;
		    }
		    logger.debug("[randoService.saveImage, ", user.email, "] All images resized successfully. Go to next step");
		    done(null, imagePaths, user, randoId, location);
		});
	    },
	    function (imagePaths, user, randoId, location, done) {
		logger.debug("Generate imageURL");
		var imageURL = config.app.url + imagePaths.origin;
		var imageSizeURL = {
		    small: config.app.url + imagePaths.small,
		    medium: config.app.url + imagePaths.medium,
		    large: config.app.url + imagePaths.large
		}
		done(null, user, randoId, imageURL, imageSizeURL, location);
	    },
	    this.updateRando
	], function (err, imageURL) {
	    if (err) {
		logger.warn("[randoService.saveImage, ", user.email, "] Can't save image, because: ", err);
		callback(err);
		return;
	    }

	    logger.debug("[randoService.saveImage, ", user.email, "] save done");
	    callback(null, {imageURL: imageURL, creation: Date.now()});
	});
    },
    updateRando: function (user, randoId, imageURL, imageSizeURL, location, callback) {
	logger.debug("[randoService.updateRando, ", user.email, "] Try update rando for: ", user.email, " location: ", location, " randoId: ", randoId, " url: ", imageURL, " image url: ", imageSizeURL);
	var mapSizeURL = mapService.locationToMapURLSync(location.latitude, location.longitude);

	async.parallel({
		addRando: function (done) {
		    randoModel.add(user.id, location, Date.now(), randoId, imageURL, imageSizeURL, mapSizeURL, function (err) {
			if (err) {
			    logger.warn("[randoService.updateRando.addRando, ", user.email, "] Can't add rando because: ", err);
			    done(Errors.System(err));
			    return;
			}
			done(null);
		})},
		updateUser: function (done) {
		    //TODO: Date.now in updateUser and addRando is differents. Use one time.
		    user.randos.push({
			user: {
			    user: user.id,
			    location: location,
			    randoId: randoId,
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
			    },
			    creation: Date.now(),
			    report: 0
			},
			stranger: {
			    user: "",
			    location: {
				latitude: 0,
				longitude: 0
			    },
			    randoId: "",
			    imageURL: "",
			    imageSizeURL: {
				small: "",
				medium: "",
				large: ""
			    },
			    mapURL: "",
			    mapSizeURL: {
				small: "",
				medium: "",
				large: ""
			    },
			    creation: 0,
			    report: 0
			}
		    });

		    logger.data("[randoService.updateRando.updateUser, ", user.email, "] Try update user");
		    userModel.update(user);
		    done(null, imageURL);
		}
	    },
	    function (err, res) {
		if (err) {
		    logger.debug("[randoService.updateRando, ", user.email, "] async parallel get error: ", err);
		    callback(err);
		    return;
		}
		callback(null, res.updateUser);
	    }
	);
    }
};

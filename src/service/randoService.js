var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var util = require("../util/util");
var mv = require("mv");
var db = require("@rando4.me/db");
var mapService = require("./mapService");
var imageService = require("./imageService");
var s3Service = require("./s3Service");
var Errors = require("../error/errors");
var gm = require("gm").subClass({ imageMagick: true });
var fs = require("fs");

function buildPostImageResponseSync (rando) {
  logger.trace("[randoService.buildPostImageResponseSync] rando:", rando);
  return {
    //1.0.15+
    randoId: rando.randoId,
    //1.0.1+
    creation: rando.creation,
    //1.0.1+
    imageURL: rando.imageURL,
    //1.0.15+
    imageSizeURL: {
      small: rando.imageSizeURL.small,
      medium: rando.imageSizeURL.medium,
      large: rando.imageSizeURL.large
    },
    //1.0.15+
    mapURL: "",
    //1.0.15+
    mapSizeURL: {
      small: "",
      medium: "",
      large: ""
    },
    //1.0.19+
    detected: Array.isArray(rando.tags) ? rando.tags.map(tag => {
      for (var detectedTag in config.app.detectedTagMap) {
        if (config.app.detectedTagMap[detectedTag].indexOf(tag) !== -1) {
          return detectedTag;
        }
      }
    }).filter(tag => tag) : []
  };
};

module.exports =  {
  saveImage (lightUser, imageInfo, location, callback) {
    logger.debug("[randoService.saveImage, ", lightUser.email, "] Try save image: ", imageInfo, " for: ", lightUser.email, " location: ", location);

    async.waterfall([
      function checkArgs (done) {
        if (!imageInfo || !imageInfo.path || !imageInfo.originalName || !location) {
          logger.warn("[randoService.saveImage, ", lightUser.email, "] Incorect args. user: ", lightUser.email, "; imageInfo: ", imageInfo, "; location: " , location);
          return done(Errors.IncorrectArgs());
        }

        //For case when hacker send a big file name:
        imageInfo.originalName = imageInfo.originalName.substring(0, 100);

        var imageRealSize = fs.statSync(imageInfo.path).size;
        if (imageRealSize <= 0) {
          logger.warn("[randoService.saveImage, ", lightUser.email, "] Real image size less or eq 0: ", imageInfo.path);
          return done(Errors.IncorrectArgs());
        }

        if (imageRealSize !== imageInfo.size) {
          //This is strange incident but not a stopper for receive image from user. Just log this.
          logger.warn("[randoService.saveImage, ", lightUser.email, "] REAL IMAGE SIZE[", imageRealSize,"] is different from uploaded[", imageInfo.size, "] Continue upload flow, but this is a strange!!!");
        }

        logger.debug("[randoService.saveImage, ", lightUser.email, "] args validation done");
        return done();
      },
      function preventDoubleSave (done) {
        logger.debug("[randoService.preventDoubleSave, ", lightUser.email, "]");
        db.user.getLightOutRandoByOrigianlFileName(lightUser.email, imageInfo.originalName, (err, data) => {
          if (!err && data && data.out[0]) {
            var savedRando = data.out[0];
            logger.data("[randoService.preventDoubleSave, ", lightUser.email, "] Duplicated rando is DETECTED. Send previously uploaded rando:", savedRando.randoId);
            var randoForResponse = buildPostImageResponseSync(savedRando);
            return done("BREAK-WATERFALL", randoForResponse);
          }

          logger.debug("[randoService.preventDoubleSave, ", lightUser.email, "] No duplicates. Continue.");
          return done();
        });
      },
      function generateImageName (done) {
        util.generateImageName(done);
      },
      function prepareUploadedImage (randoId, imagePaths, done) {
        var newRandoPath = config.app.static.folder.name + imagePaths.origin;
        logger.data("[randoService.saveImage, ", lightUser.email, "] move: ", imageInfo.path, " --> ", newRandoPath);
        mv(imageInfo.path, newRandoPath, {mkdirp: true}, function (err) {
          if (err) {
            logger.warn("[randoService.saveImage, ", lightUser.email, "] Can't move  ", imageInfo.path, " to ", newRandoPath, " because: ", err);
            return done(Errors.System(err));
          }

          return done(null, newRandoPath, imagePaths, lightUser, randoId, location);
        });
      },
      function convertToSizes (imagePath, imagePaths, lightUser, randoId, location, done) {
        logger.data("[randoService.saveImage, ", lightUser.email, "] Try resize images to small, medium and large sizes");

        async.parallel({
          small (parallelCallback) {
            imageService.resize("small", imagePaths, randoId, imagePath, parallelCallback);
          },
          medium (parallelCallback) {
            imageService.resize("medium", imagePaths, randoId, imagePath, parallelCallback);
          },
          large (parallelCallback) {
            imageService.resize("large", imagePaths, randoId, imagePath, parallelCallback);
          }
        }, function (err) {
          if (err) {
            logger.error("[randoService.saveImage, ", lightUser.email, "] Can not resize images because: ", err);
            return done(err);
          }

          logger.debug("[randoService.saveImage, ", lightUser.email, "] All images resized successfully. Go to next step");
          return done(null, imagePaths, lightUser, randoId, location);
        });
      },
      function recognizeImage (imagePaths, lightUser, randoId, location, done) {
        if (!config.app.recognitionEnabled) {
          return done(null, imagePaths, lightUser, randoId, location, []);
        }

        require("randoRecognition").recognizeWithScaners(config.app.static.folder.name + imagePaths.small, config.app.enabledScaners, function (err, tags) {
          if (err) {
            tags = [];
            logger.error("[randoService.recognizeImage, ", lightUser.email, "] Can not recognize image because: ", err, "Skip this step!");
          }

          logger.debug("[randoService.recognizeImage, ", lightUser.email, "] Image recognized successfully. Tags: ", tags);

          return done(null, imagePaths, lightUser, randoId, location, tags);
        });
      },
      function uploadToS3 (imagePaths, lightUser, randoId, location, tags, done) {
          var imageSizeURL = {}; //will be filled after each size upload to S3

          async.parallel({
            uploadSmall (parallelCallback) {
              s3Service.upload(imagePaths, "small", function (err, url) {
                if (err) {
                  return parallelCallback(err);
                }
                imageSizeURL.small = url;
                return parallelCallback();
              });
            },
            uploadMedium (parallelCallback) {
              s3Service.upload(imagePaths, "medium", function (err, url) {
                if (err) {
                  return parallelCallback(err);
                }
                imageSizeURL.medium = url;
                return parallelCallback();
              });
            },
            uploadLarge (parallelCallback) {
              s3Service.upload(imagePaths, "large", function (err, url) {
                if (err) {
                  return parallelCallback(err);
                }
                imageSizeURL.large = url;
                return parallelCallback();
              });
            }
          }, function (err) {
            if (err) {
              logger.error("[randoService.saveImage, ", lightUser.email, "] Can not upload image to S3, because: ", err);
              return done(err);
            }

            logger.debug("[randoService.saveImage, ", lightUser.email, "] All images uploaded to S3 successfully. Go to next step");
            return done(null, imagePaths, lightUser, randoId, imageSizeURL, location, tags);
          });
      },
      function rmImages (imagePaths, lightUser, randoId, imageSizeURL, location, tags, done) {
        async.parallel({
          rmOrigin (parallelCallback) {
            var originFile = config.app.static.folder.name + imagePaths.origin;
            fs.unlink(originFile, function (err) {
              if (err) {
                return parallelCallback(err);
              }
              return parallelCallback();
            });
          },
          rmSmall (parallelCallback) {
            var smallFile = config.app.static.folder.name + imagePaths.small;
            fs.unlink(smallFile, function (err) {
              if (err) {
                return parallelCallback(err);
              }
              return parallelCallback();
            });
          },
          rmMedium (parallelCallback) {
            var mediumFile = config.app.static.folder.name + imagePaths.medium;
            fs.unlink(mediumFile, function (err) {
              if (err) {
                return parallelCallback(err);
              }
              return parallelCallback();
            });
          },
          rmLarge (parallelCallback) {
            var largeFile = config.app.static.folder.name + imagePaths.large;
            fs.unlink(largeFile, function (err) {
              if (err) {
                return parallelCallback(err);
              }
              return parallelCallback();
            });
          }
        }, function (err) {
          if (err) {
            logger.error("[randoService.saveImage, ", lightUser.email, "] Can not remove image from fs, because: ", err);
            return done(err);
          };

          logger.debug("[randoService.saveImage, ", lightUser.email, "] All tmp images deleted from fs. Go to next step");
          return done(null, lightUser, randoId, imageSizeURL, location, tags);
        });
      },
      function lookupLocation (lightUser, randoId, imageSizeURL, location, tags, done) {
        logger.debug("[randoService.lookupLocation", lightUser.email, "] Lookup location");
        var mapSizeURL = {};
        var randoIp = lightUser.ip;

        if (location.latitude && location.longitude) {
          logger.debug("[randoService.lookupLocation", lightUser.email, "] GPS is enabled. Lookup city by location:", location);
          mapSizeURL = mapService.locationToMapURLSync(location.latitude, location.longitude);
        } else {
          logger.debug("[randoService.lookupLocation", lightUser.email, "] GPS is disabled. Lookup city by ip:", randoIp);
          mapSizeURL = mapService.ipToMapURLSync(randoIp);
        }

        return done(null, lightUser, randoId, imageSizeURL, location, mapSizeURL, tags);
      },
      function updateRandoInDB (lightUser, randoId, imageSizeURL, location, mapSizeURL, tags, done) {
        var imageURL = imageSizeURL.large;
        var mapURL = mapSizeURL.large;
        var self = this;

        logger.debug("[randoService.updateRandoInDB,", lightUser.email, "] Try update rando for this user, randoId:", randoId, "url:", imageURL, "map url:", mapURL);

        var newRando = {
          email: lightUser.email,
          creation: Date.now(),
          originalFileName: imageInfo.originalName,
          randoId,
          imageURL,
          mapURL,
          location,
          imageSizeURL,
          mapSizeURL,
          ip: lightUser.ip,
          tags,
          delete: 0,
          report: 0
        };

        async.parallel({
          addRandoToDBBucket (addDone) {
            logger.trace("[randoService.updateRandoInDB.addRandoToDBBucket,", lightUser.email, "]");
            db.rando.add(newRando, addDone);
          },
          addRandoToUserOut (addDone) {
            logger.trace("[randoService.updateRandoInDB.addRandoToUserOut,", lightUser.email, "]");
            db.user.addRandoToUserOutByEmail(lightUser.email, newRando, addDone);
          }
        }, function (err) {
          if (err) {
            logger.debug("[randoService.updateRandoInDB, ", lightUser.email, "] async parallel get error:", err);
            return done(Errors.System(err));
          }
          return done(null, newRando);
        });
      },
      function buildRando (rando, done) {
        logger.trace("[randoService.buildRando,", lightUser.email, "]");
        var randoForResponse = buildPostImageResponseSync(rando);
        return done(null, randoForResponse);
      }
    ], function (err, rando) {
      if (err === "BREAK-WATERFALL") {
        logger.debug("[randoService.saveImage, ", lightUser.email, "] We break waterfall and send response");
        err = null;
      }

      if (err) {
        logger.warn("[randoService.saveImage, ", lightUser.email, "] Can't save image, because: ", err);
        return callback(err);
      }

      logger.debug("[randoService.saveImage, ", lightUser.email, "] save done");
      return callback(null, rando);
    });
  },
  buildRandoSync (rando) {
    if (!rando) {
      logger.trace("[randoService.buildRando]", "rando is empty => return empty object");
      return {};
    }

    logger.trace("[randoService.buildRando] build rando with id: ", rando.randoId);

    return {
      creation: rando.creation,
      randoId: rando.randoId,
      imageURL: rando.imageURL,
      imageSizeURL: rando.imageSizeURL,
      mapURL: rando.mapURL,
      mapSizeURL: rando.mapSizeURL,
      rating: rando.rating,
      //1.0.19+
      detected: Array.isArray(rando.tags) ? rando.tags.map(tag => {
        for (var detectedTag in config.app.detectedTagMap) {
          if (config.app.detectedTagMap[detectedTag].indexOf(tag) !== -1) {
            return detectedTag;
          }
        }
      }).filter(tag => tag) : []
    };
  }
};

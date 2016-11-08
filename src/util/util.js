var config = require("config");
var crypto = require("crypto");
var fs = require("fs");
var async = require("async");
var logger = require("../log/logger");
var Errors = require("../error/errors");

module.exports = {
  generateImageName: function (callback) {
    logger.debug("[util.generateImageName]");
    async.waterfall([
      this.generateUniqueName,
      function (name, done) {
        var imagePaths = {
          origin: config.app.static.folder.image + config.app.img.folder.origin + name + "." + config.app.img.ext,
          small: config.app.static.folder.image + config.app.img.folder.small + name + "." + config.app.img.ext,
          medium: config.app.static.folder.image + config.app.img.folder.medium + name + "." + config.app.img.ext,
          large: config.app.static.folder.image + config.app.img.folder.large + name + "." + config.app.img.ext
        }
        logger.debug("imagePaths: ", imagePaths);
        done(null, name, imagePaths);
      }],
      function (err, name, imagePaths) {
        if (err) {
          logger.warn("genereImageName fail with error: ", err);
          callback(Errors.System(err));
          return;
        }

        callback(null, name, imagePaths);
      });
  },
  generateUniqueName: function (callback) {
    logger.debug("[util.generateUniqueName]");
    crypto.pseudoRandomBytes(config.app.static.file.length, function(ex, buf) {
      if (ex) {
        logger.warn("Can't genererateUniqueName: ", ex);
        callback(Errors.System(ex));
        return;
      }

      logger.debug("Unique name generated successful");

      callback(null, buf.toString("hex"));
    });
  },
  getSizeableOrEmpty (sizableObject) {
    var result = {
      small: "",
      medium: "",
      large: ""
    };

    if (sizableObject && sizableObject.small) {
      result.small = sizableObject.small;
    }

    if (sizableObject && sizableObject.medium) {
      result.medium = sizableObject.medium;
    }

    if (sizableObject && sizableObject.large) {
      result.large = sizableObject.large;
    }

    return result;
  },
  getTokenFromRequest (req) {
    logger.debug("[until.getTokenFromRequest]. Authorization header:", req.headers.authorization);

    var token = /Token\s+(\w+)/.exec(req.headers.authorization);
    if (token && token[1]) {
      return token[1];
    }

    return null;
  }
};


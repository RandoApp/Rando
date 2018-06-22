const logger = require("../log/logger");
const db = require("@rando4.me/db");
const config = require("config");
const Errors = require("../error/errors");
const backwardCompatibility = require("../util/backwardCompatibility");
const util = require("../util/util");

module.exports = {
  getUser(email, callback) {
    logger.debug("[userService.getUser, ", email, "] Try get user");
    var user = {
      email: email,
      in: [],
      out: []
    };

    db.user.getAllLightInAndOutRandosByEmail(email, (err, randos) => {
      if (err) {
        logger.warn("[userService.getUser] Error when make getAllLightInAndOutRandosByEmail call to db, because: ", err);
        return callback(Errors.System(err));
      }

      user.in = randos.in.filter(rando => {
        return rando.delete !== 1 && rando.report !== 1 && rando.randoId;
      });

      user.out = randos.out.filter(rando => {
        return rando.delete !== 1 && rando.report !== 1 && rando.randoId;
      });

      user.in.forEach(rando => {
        delete rando.delete;
        delete rando.report;
      });

      user.out.forEach(rando => {
        rando.mapURL = rando.strangerMapURL ? rando.strangerMapURL : "";
        rando.mapSizeURL = util.getSizeableOrEmpty(rando.strangerMapSizeURL);
        delete rando.strangerMapURL;
        delete rando.strangerMapSizeURL;
        delete rando.delete;
        delete rando.report;
        rando.detected = Array.isArray(rando.tags) ? rando.tags.map(tag => {
          for (var detectedTag in config.app.detectedTagMap) {
            if (config.app.detectedTagMap[detectedTag].indexOf(tag) !== -1) {
              return detectedTag;
            }
          }
        }).filter(tag => tag) : [];
        delete rando.tags;
      });

      return callback(null, user);
    });
  },
  getBackwardCompatibleUser(email, callback) {
    this.getUser(email, (err, user) => {
      if (err) {
        return callback(err);
      }

      backwardCompatibility.makeUserBackwardCompaitble(user, (err, compatibleUserJSON) => {
        if (err) {
          logger.warn("[userService.getUser] Error when make user backward compaitble");
          return callback(Errors.System(err));
        }
        callback(null, compatibleUserJSON);
      });
    });
  }
};

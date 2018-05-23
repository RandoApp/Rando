const logger = require("../log/logger");
const db = require("@rando4.me/db");
const config = require("config");
const Errors = require("../error/errors");
const backwardCompatibility = require("../util/backwardCompatibility");
const util = require("../util/util");

module.exports = {
  getUserStats(email, callback) {
    logger.debug("[statService.getUserStatistics, ", email, "] Try get user");

    db.user.getUserStatistics(email, (err, stats) => {
      if (err) {
        logger.warn("[statService.getUserStatistics] Error when make getUserStatistics call to db, because: ", err);
        return callback(Errors.System(err));
      }
      return callback(null, stats);
    });
  }
};

const logger = require("../log/logger");
const db = require("@rando4.me/db");
const Errors = require("../error/errors");

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

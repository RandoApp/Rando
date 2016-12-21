var db = require("randoDB");
var logger = require("../log/logger");

module.exports = {
  run (req, res, next) {
    logger.info("Start flushUserMetaToDBFilter for user:", req.lightUser.email);

    db.user.updateUserMetaByEmail(req.lightUser.email, {
      ip: req.lightUser.ip,
      firebaseInstanceIds: req.lightUser.firebaseInstanceIds
    }, function (err) {
      if (err) {
        logger.err("[flushUserMetaToDBFilter]", "Cannot update user meta in DB as background task, because:", err);
      }
    });

    next();
  }
};

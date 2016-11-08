var db = require("randoDB");
var logger = require("../log/logger");

module.exports = {
  run (req, res, next) {
    var user = req.lightUser;
    db.user.getLastLightOutRandosByEmail(user.email, config.app.limit.images, function (err, randos) {
      if (err) {
        logger.err("[noSpamFilter]", "Cannot fetch last N randos from DB, because:", err);
      }

      if (!err && randos && randos.length === config.app.limit.images) {
        var timeBetwenImagesLimit = Date.now() - randos[randos.length - 1].creation;

        if (timeBetwenImagesLimit <= config.app.limit.time) {
          logger.warn("[noSpamFilter, ", user.email, "] Spam found!!! Return Forbidden");

          db.user.updateUserMetaByEmail(user.email, {
            ban: Date.now() + config.app.limit.ban
          }, function (err) {
            if (err) {
              logger.err("[noSpamFilter]", "Cannot update user ban field in DB, because:", err);
            }
            return sendForbidden(res, user.ban);
          });
        }
      }

      return next();
    });
  }
};

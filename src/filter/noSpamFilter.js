var db = require("randoDB");
var logger = require("../log/logger");
var config = require("config");
var Errors = require("../error/errors");

function sendForbidden(res, ban) {
  var response = Errors.toResponse(Errors.Forbidden(ban));
  res.status(response.status).send(response);
}

module.exports = {
  run (req, res, next) {
    logger.info("Start noSpamFilter for user:", req.lightUser.email);
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

var db = require("randoDB");
var logger = require("../log/logger");
var config = require("config");
var Errors = require("../error/errors");

function sendForbidden (res, ban) {
  var response = Errors.toResponse(Errors.Forbidden(ban));
  res.status(response.status).send(response);
}

function isSpamDetected (randos) {
  randos.sort((a, b) => a.creation - b.creation);

  logger.debug("[noSpamFilter.isSpamDetected]", "Analyze randos array with length: ", randos.length);

  if (randos.length >= config.app.limit.images) {
    logger.debug("[noSpamFilter.isSpamDetected]", "Randos size is bigger that limit. We should caclulate time");
    var lastRando = randos[config.app.limit.images - 1];
    logger.debug("[noSpamFilter.isSpamDetected]", "lastRando:", lastRando);
    var timeBetwenImagesLimit = Date.now() - lastRando.creation;
    logger.debug("[noSpamFilter.isSpamDetected]", "Calculateion timeBetwenImagesLimit:", Date.now(), "-", lastRando.creation, " = ", timeBetwenImagesLimit);
    return timeBetwenImagesLimit <= config.app.limit.time;
  }
  logger.debug("[noSpamFilter.isSpamDetected]", "No spam");
  return false;
}

module.exports = {
  run (req, res, next) {
    logger.info("Start noSpamFilter for user:", req.lightUser.email);
    var user = req.lightUser;
    db.user.getAllLightOutRandosByEmail(user.email, config.app.limit.images, function (err, userWithOut) {
      if (err) {
        logger.error("[noSpamFilter]", "Cannot fetch last N randos from DB, because:", err);
        return next();
      }

      if (!userWithOut || !userWithOut.out) {
        logger.error("[noSpamFilter]", "User is empty or don't have out:", userWithOutg);
        return next();
      }

      if (isSpamDetected(userWithOut.out)) {
        var ban = Date.now() + config.app.limit.ban;
        logger.warn("[noSpamFilter, ", user.email, "] Spam found!!! Ban user to:", ban, " and send Forbidden.");

        db.user.updateUserMetaByEmail(user.email, {ban}, (err) => {
          if (err) {
            logger.error("[noSpamFilter]", "Cannot update user ban field in DB, because:", err);
          }
          return sendForbidden(res, ban);
        });
      } else {
        return next();
      }
    });
  }
};

var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var config = require("config");
var Errors = require("../error/errors");
var pushNotificationService = require("./pushNotificationService");

module.exports = {
  delete (user, randoId, callback) {
    logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
    async.parallel([
      function deleteFromOut(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromOut: ", randoId);
        db.user.updateDeleteFlagForOutRando(user.email, randoId, 1, done);
      },
      function deleteFromIn(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromIn: ", randoId);
        db.user.updateDeleteFlagForInRando(user.email, randoId, 1, done);
      }
    ], function (err) {
      logger.trace("[commentService.delete, ", user.email, "]", "Processing db updated results for rando: ", randoId);
      if (err) {
        logger.debug("[commentService.delete, ", user.email, "] We have error in DB when updating user with rando: ", randoId, " Error: ", err.message);
        return callback(Errors.System(err));
      }
      logger.debug("[commentService.delete, ", user.email, "] User successfully updated with deleted rando: ", randoId);
      return callback(null, {command: "delete", result: "done"});
    });
  },
  report (goodUser, reporedRandoId, callback) {
    logger.debug("[commentService.report, ", goodUser.email, "] Start report rando: ", reporedRandoId);
    if (!goodUser || !goodUser.email || !reporedRandoId) {
      return callback(Errors.IncorrectArgs());
    }

    async.waterfall([
      function fetchBadUser (done) {
        db.user.getLightUserMetaByOutRandoId(reporedRandoId, done);
      },
      function updateData (badUser, done) {
        if (!badUser || !badUser.email) {
          return done(Errors.IncorrectArgs());
        }

        async.parallel({
          reportRandoOnGoodUser (parallelDone) {
            logger.trace("[commentService.report.reportRandoOnGoodUser, report by: ", goodUser.email, "for user: ", badUser.email, "reportRando: ", reporedRandoId);
            db.user.updateReportFlagForInRando(goodUser.email, reporedRandoId, 1, parallelDone);
          },
          addEventToReportArrayForBadUser (parallelDone) {
            logger.trace("[commentService.report.addEventToReportArrayForBadUser, ", goodUser.email, "]", "reportUserByRandoId: ", reporedRandoId);
            var reportData = {
              reportedBy: goodUser.email,
              randoId: reporedRandoId,
              reportedDate: Date.now(),
              reason: "Reported by " + goodUser.email + " because randoId: " + reporedRandoId
            };

            db.user.addReportForUser(badUser.email, reportData, parallelDone);
          },
          banBadUserIfNecessary (parallelDone) {
            logger.trace("[commentService.report.banBadUserIfNecessary, ", badUser.email, "]", "reportedRandoId: ", reporedRandoId);
            if (Array.isArray(badUser.report)) {
              var users = badUser.report.map(r => r.reportedBy);
              //Current report event in db can be added after this method, because executed in parallel. Force set user:
              users.push(goodUser.email);
              if (new Set(users).size >= config.app.limit.reporedByUsers) {
                db.user.updateUserMetaByEmail(badUser.email, {ban: config.app.limit.permanentBanTo}, parallelDone);
              } else {
                logger.trace("[commentService.report.banBadUserIfNecessary, ", badUser.email, "]", "Don't have enough unique users to ban this badUser");
                return parallelDone();
              }
            } else {
              logger.trace("[commentService.report.banBadUserIfNecessary, ", badUser.email, "]", "badUser.report is not an array");
              return parallelDone();
            }
          }
        }, done);
      }], (err) => {
        logger.trace("[commentService.report, ", goodUser.email, "]", "Processing db updated results for rando: ", reporedRandoId);
        if (err) {
          logger.debug("[commentService.report, ", goodUser.email, "] We have error in DB when updating user with rando: ", reporedRandoId, " Error: ", err.message);
          return callback(Errors.System(err));
        }
        logger.debug("[commentService.report, ", goodUser.email, "] User successfully updated with reported rando: ", reporedRandoId);
        return callback(null, {command: "report", result: "done"});
      }
    );
  },
  rate (user, randoId, rating, callback) {
    logger.debug("[commentService.rate, ", user.email, "] Start rate rando:", randoId);
    rating = parseInt(rating);
    async.waterfall([
      function fetchBadUser (done) {
        db.user.getLightUserMetaByOutRandoId(randoId, done);
      },
      function updateData (stranger, done) {
        async.parallel({
          rateRandoForUserIn (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForUserIn, ", user.email, "for user: ", stranger.email, "rateRando: ", randoId);
            db.user.updateRatingForInRando(user.email, randoId, rating, parallelDone);
          },
          rateRandoForStrangerOut (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForStrangerOut, ", stranger.email, "by user: ", user.email, "rateRando: ", randoId);
            db.user.updateRatingForOutRando(stranger.email, randoId, rating, parallelDone);
          }
        }, (err) => {
          done(err, stranger);
        });
      },
      function notifyStrangerAboutRatingUpdate (stranger, done) {
        var message = {
          notificationType: "rated",
          rando: {
            randoId,
            rating
          }
        };
        pushNotificationService.sendMessageToAllActiveUserDevices(message, stranger, done);
      }
    ], (err) => {
        logger.trace("[commentService.rate, ", user.email, "]", "Processing db updated results for rando: ", randoId);
        if (err) {
          logger.debug("[commentService.rate, ", user.email, "] We have error in DB when updating user with rando: ", randoId, " Error: ", err.message);
          return callback(Errors.System(err));
        }
        logger.debug("[commentService.rate, ", user.email, "] User successfully updated with reported rando: ", randoId);
        return callback(null, {command: "rate", result: "done"});
    });
  }
};

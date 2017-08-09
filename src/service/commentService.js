const db = require("randoDB");
const logger = require("../log/logger");
const async = require("async");
const config = require("config");
const Errors = require("../error/errors");
const pushNotificationService = require("./pushNotificationService");
const randoService = require("./randoService");

module.exports = {
  delete (user, randoId, callback) {
    logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
    async.parallel([
      function deleteFromOut(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromOut: ", randoId);
        db.user.updateOutRandoProperties(user.email, randoId, {delete: 1}, done);
      },
      function deleteFromIn(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromIn: ", randoId);
        db.user.updateInRandoProperties(user.email, randoId, {delete: 1}, done);
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
            db.user.updateInRandoProperties(goodUser.email, reporedRandoId, {report: 1}, parallelDone);
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
    if (rating < 1 || rating > 3) {
      return callback(Errors.IncorrectArgs());
    }

    async.waterfall([
      function fetchStranger (done) {
        db.user.getLightUserMetaByOutRandoId(randoId, done);
      },
      function checkThatUserDoesNotRatedHimself (stranger, done) {
        if (stranger.email === user.email) {
          return done(Errors.IncorrectArgs());
        }

        return done(null, stranger);
      },
      function updateData (stranger, done) {
        async.parallel({
          rateRandoForUserIn (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForUserIn, ", user.email, "for user: ", stranger.email, "rateRando: ", randoId);
            db.user.updateInRandoProperties(user.email, randoId, {rating}, parallelDone);
          },
          rateRandoForStrangerOut (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForStrangerOut, ", stranger.email, "by user: ", user.email, "rateRando: ", randoId);
            db.user.updateOutRandoProperties(stranger.email, randoId, {rating}, parallelDone);
          }
        }, err => {
          done(err, stranger);
        });
      },
      function fetchRatedStrangerRando (stranger, done) {
        logger.trace("[commentService.rate.fetchRatedStrangerRando]", "Fetch rando by randoId:", randoId);
        db.user.getLightRandoByRandoId(randoId, (err, data) => {
          let ratedRando = null;
          if (data && data.out[0]) {
            ratedRando = data.out[0];
          }
          logger.trace("[commentService.rate.fetchRatedStrangerRando]", "ratedRando:", ratedRando);
          return done(err, stranger, ratedRando);
        });
      },
      function notifyStrangerAboutRatingUpdate (stranger, ratedRando, done) {
        logger.trace("[commentService.rate.notifyStrangerAboutRatingUpdate]", "Send rated notification to", stranger.email, "with rando:", ratedRando);
        var message = {
          notificationType: "rated",
          rando: randoService.buildRandoSync(ratedRando)
        };
        pushNotificationService.sendMessageToAllActiveUserDevices(message, stranger, done);
      }
    ], err => {
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

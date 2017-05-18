var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var config = require("config");
var Errors = require("../error/errors");

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
            logger.trace("[commentService.report.reportRando, report by: ", goodUser.email, "for user: ", badUser.email, "reportRando: ", reporedRandoId);
            db.user.updateReportFlagForInRando(goodUser.email, reporedRandoId, 1, parallelDone);
          },
          addEventToReportArrayForBadUser (parallelDone) {
            logger.trace("[commentService.report.reportUserByRandoId, ", goodUser.email, "]", "reportUserByRandoId: ", reporedRandoId);
            db.user.addReportForUser(badUser.email, {
              reportedBy: goodUser.email,
              randoId: reporedRandoId,
              reportedDate: Date.now(),
              reason: "Reported by " + goodUser.email + " because randoId: " + reporedRandoId,
            }, parallelDone);
          },
          banBadUserIfNecessary (parallelDone) {
            if (Array.isArray(badUser.report)) {
              var users = badUser.report.map(r => r.reportedBy);
              users.push(goodUser.email);
              if (new Set(users).size >= config.app.limit.reporedByUsers) {
                db.user.updateUserMetaByEmail(badUser.email, {ban: config.app.limit.permanentBanTo}, parallelDone);
              }
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
  }
};

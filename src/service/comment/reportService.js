const db = require("@rando4.me/db");
const async = require("async");
const config = require("config");
const logger = require("../../log/logger");
const Errors = require("../../error/errors");

module.exports = {
  report(goodUser, reporedRandoId, callback) {
    logger.debug("[reportService.report, ", goodUser.email, "] Start report rando: ", reporedRandoId);
    if (!goodUser || !goodUser.email || !reporedRandoId) {
      return callback(Errors.IncorrectArgs());
    }

    async.waterfall([
      function fetchBadUser(done) {
        db.user.getLightUserMetaByOutRandoId(reporedRandoId, done);
      },
      function updateData(badUser, done) {
        if (!badUser || !badUser.email) {
          return done(Errors.IncorrectArgs());
        }

        async.parallel({
          reportRandoOnGoodUser(parallelDone) {
            logger.trace("[reportService.report.reportRandoOnGoodUser, report by: ", goodUser.email, "for user: ", badUser.email, "reportRando: ", reporedRandoId);
            db.user.updateInRandoProperties(goodUser.email, reporedRandoId, {
              report: 1
            }, parallelDone);
          },
          addEventToReportArrayForBadUser(parallelDone) {
            logger.trace("[reportService.report.addEventToReportArrayForBadUser, ", goodUser.email, "]", "reportUserByRandoId: ", reporedRandoId);
            var reportData = {
              reportedBy: goodUser.email,
              randoId: reporedRandoId,
              reportedDate: Date.now(),
              reason: "Reported by " + goodUser.email + " because randoId: " + reporedRandoId
            };

            db.user.addReportForUser(badUser.email, reportData, parallelDone);
          },
          banBadUserIfNecessary(parallelDone) {
            logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "reportedRandoId: ", reporedRandoId);
            if (Array.isArray(badUser.report)) {

              // Get last [two weeks] report events. And calculate unic users
              var users = badUser.report.filter(r => (Date.now() - r.reportedDate) <= config.app.limit.lastNTimeReports).map(r => r.reportedBy);
              //Current report event in db can be added after this method, because executed in parallel. Force set user:
              users.push(goodUser.email);

              logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "got users: ", users);
              const unicUsers = new Set(users);
              logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "got unic users: ", unicUsers);

              if (unicUsers.size >= config.app.limit.reporedByUsers) {
                logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "Ban user: ", badUser.email);
                db.user.updateUserMetaByEmail(badUser.email, {
                  ban: config.app.limit.permanentBanTo
                }, parallelDone);
              } else {
                logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "Don't have enough unique users to ban this badUser");
                return parallelDone();
              }
            } else {
              logger.trace("[reportService.report.banBadUserIfNecessary, ", badUser.email, "]", "badUser.report is not an array");
              return parallelDone();
            }
          }
        }, done);
      }
    ], (err) => {
      logger.trace("[reportService.report, ", goodUser.email, "]", "Processing db updated results for rando: ", reporedRandoId);
      if (err) {
        logger.debug("[reportService.report, ", goodUser.email, "] We have error in DB when updating user with rando: ", reporedRandoId, " Error: ", err.message);
        return callback(Errors.System(err));
      }
      logger.debug("[reportService.report, ", goodUser.email, "] User successfully updated with reported rando: ", reporedRandoId);
      return callback(null, {
        command: "report",
        result: "done"
      });
    });
  }
};

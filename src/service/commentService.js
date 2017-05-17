var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
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
  report (user, randoId, callback) {
    logger.debug("[commentService.report, ", user.email, "] Start report rando: ", randoId);
    async.parallel([
      reportRando (done) {
        logger.trace("[commentService.report.reportRando, ", user.email, "]", "reportRando: ", randoId);
        db.user.updateReportFlagForInRando(user.email, randoId, 1, done);
      },
      reportUserByRandoId (done) {
        logger.trace("[commentService.report.reportUserByRandoId, ", user.email, "]", "reportUserByRandoId: ", randoId);
        db.user.addReportForUserByRandoId(randoId, {
          created: Date.now(),
          reason: "Reported by " + user.email + " because randoId: " + randoId,
        }, done);
      }
    ], function (err) {
      logger.trace("[commentService.report, ", user.email, "]", "Processing db updated results for rando: ", randoId);
      if (err) {
        logger.debug("[commentService.report, ", user.email, "] We have error in DB when updating user with rando: ", randoId, " Error: ", err.message);
        return callback(Errors.System(err));
      }
      logger.debug("[commentService.report, ", user.email, "] User successfully updated with reported rando: ", randoId);
      return callback(null, {command: "report", result: "done"});
    });

  }
};

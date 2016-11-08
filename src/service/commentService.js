var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
  delete: function (user, randoId, callback) {
    logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
    async.parallel([
      function deleteFromOut(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromOut: ", randoId);
        db.user.updateDeleteFlagForOutRando(user.email, randoId, true, done);
      },
      function deleteFromIn(done) {
        logger.trace("[commentService.delete, ", user.email, "]", "deleteFromIn: ", randoId);
        db.user.updateDeleteFlagForInRando(user.email, randoId, true, done);
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
  }
};

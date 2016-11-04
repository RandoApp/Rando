var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
  delete: function (user, randoId, callback) {
    logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
    db.user.updateDeleteFlagForRando(user.email, randoId, true, function (err, data) {
      logger.trace("[commentService.delete, ", user.email, "]", "Processing db updated result for rando: ", randoId);
      if (err) {
        logger.debug("[commentService.delete, ", user.email, "] We have error in DB when updating user with deleted rando: ", randoId, " Error: ", err.message);
        return callback(Errors.System(err));
      }
      logger.debug("[commentService.delete, ", user.email, "] User successfully updated with delteed rando: ", randoId, "DATA: ", data);
      return callback(null, {command: "delete", result: "done"});
    });
  }
};

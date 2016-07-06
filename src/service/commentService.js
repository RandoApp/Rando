var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
    delete: function (user, randoId, callback) {
    	logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
        var randos = user.out.concat(user.in);

        async.find(randos, function (rando, done) {
            logger.trace("[commentService.delete, ", user.email, "]", "Try find rando. rando.randoId[", rando.randoId, "] == randoId[", randoId, "]");
            done(null, rando.randoId === randoId);
        }, function (error, rando) {
            logger.trace("[commentService.delete, ", user.email, "]", "Processing found rando: ", rando);
            if (!rando) {
                logger.debug("[commentService.delete, ", user.email, "] We have error or empty result when finding rando with randoId: ", randoId);
                callback(Errors.RandoNotFound());
                return;
            }

            logger.debug("[commentService.delete, ", user.email, "] Rando found. Delete rando: ", rando.randoId);

            logger.trace("[commentService.delete, ", user.email, "]", "Set delete flag to 1 for rando: ", rando.randoId);
            rando.delete = 1;

            logger.trace("[commentService.delete, ", user.email, "]", "Trying update user with deleted rando : ", rando.randoId);
            db.user.update(user, function (err) {
                logger.trace("[commentService.delete, ", user.email, "]", "Processing db updated result for rando: ", rando.randoId);
                if (err) {
                    logger.debug("[commentService.delete, ", user.email, "] We have error in DB when updating user with deleted rando: ", randoId, " Error: ", err.message);
                    callback(Errors.System(err));
                    return;
                }
                logger.debug("[commentService.delete, ", user.email, "] User successfully updated with delteed rando: ", randoId);
                callback(null, {command: "delete", result: "done"});
            });
        });
    }
};

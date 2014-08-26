var db = require("randoDB");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
    delete: function (user, randoId, callback) {
	logger.debug("[commentService.delete, ", user.email, "] Start delete rando: ", randoId);
        var randos = user.gifts.concat(user.receives);

        async.detect(randos, function (rando, done) {
            done(rando.randoId == randoId);
        }, function (rando) {
            if (!rando) {
                callback(Errors.RandoNotFound());
                return;
            }

            logger.debug("[commentService.delete, ", user.email, "] Rando found. Delete rando: " + rando.randoId);

            rando.delete = 1;
            db.user.update(user, function (err) {
                if (err) {
                    callback(Errors.System());
                    return;
                }
                callback(null, {command: "delete", result: "done"});
            });
        });
    }
};

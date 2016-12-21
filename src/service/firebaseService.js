var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

module.exports = {
  addOrUpdateFirebaseInstanceIdOnUser (user, firebaseInstanceId, callback) {
    //This if is needed to support old clients
    //TODO: Remove when all clients will be on 1.0.15+
    if (!firebaseInstanceId) {
      return callback(null, user);
    }

    if (!user.firebaseInstanceIds) {
      user.firebaseInstanceIds = [];
    }

    async.detect(user.firebaseInstanceIds, (instanceIdTest, done) => {
      done(null, instanceIdTest.instanceId === firebaseInstanceId);
    }, (err, instanceIdFound) => {
      if (err) {
        logger.log("[userService.addOrUpdateFirebaseInstanceId]", err);
        return callback(Errors.System(err));
      }

      if (instanceIdFound) {
        logger.debug("[userService.addOrUpdateFirebaseInstanceId]", "Activating firebaseInstanceId:", firebaseInstanceId, "for user:", user.email);
        instanceIdFound.lastUsedDate = Date.now();
        instanceIdFound.active = true;
      } else {
        logger.debug("[userService.addOrUpdateFirebaseInstanceId] ","Adding new firebaseInstanceId:", firebaseInstanceId, " for user:", user.email);
        var now = Date.now();
        user.firebaseInstanceIds.push({
          instanceId: firebaseInstanceId,
          active: true,
          createdDate: now,
          lastUsedDate: now
        });
      }
      return callback(null, user);
    });
  }
};

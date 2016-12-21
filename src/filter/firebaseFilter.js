var Errors = require("../error/errors");
var logger = require("../log/logger");
var firebaseService = require("../service/firebaseService");

module.exports = {
  run (req, res, next) {
    logger.info("Start fireBaseFilter for user:", req.lightUser.email);
    var firebaseInstanceId = req.get("FirebaseInstanceId");

    firebaseService.addOrUpdateFirebaseInstanceIdOnUser(req.lightUser, firebaseInstanceId, function (err) {
      if (err) {
        var response = Errors.toResponse(err);
        return res.status(response.status).send(response);
      }

      return next();
    });
  }
};

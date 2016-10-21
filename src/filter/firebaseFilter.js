var Errors = require("../error/errors");
var logger = require("../log/logger");
var userService = require("../service/userService");

function run (req, res, next) {
  logger.info("Start fireBaseFilter for user:", req.lightUser.email);
  var firebaseInstanceId = req.get("FirebaseInstanceId");

  userService.addOrUpdateFirebaseInstanceId(req.lightUser, firebaseInstanceId, function (err) {
    if (!err) {
      return next();
    } else {
      var response = Errors.toResponse(Errors.System(err));
      return res.status(response.status).send(response);
    }
  });
}

module.exports = {
  run
};

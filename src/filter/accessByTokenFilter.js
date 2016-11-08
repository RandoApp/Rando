var Errors = require("../error/errors");
var db = require("randoDB");
var logger = require("../log/logger");
var util = require("../util/util");

function sendUnauthorized (res) {
  var response = Errors.toResponse(Errors.Unauthorized());
  res.status(response.status).send(response);
}

module.exports = {
  run (req, res, next) {
    var token = util.getTokenFromRequest(req);
    if (!token) {
      return sendUnauthorized(res);
    }

    db.user.getLightUserByToken(token, function (err, user) {
      if (err) {
        logger.err("[access.checkAccess] Error when db.user.getByToken:", err);
        var response = Errors.toResponse(Errors.System(err));
        return res.status(response.status).send(response);
      } else if (!user) {
        logger.warn("[access.checkAccess] User with token:", token, " not exists. Send Unauthorized");
        return sendUnauthorized(res);
      }

      req.lightUser = user;
      next();
    });
  }
};

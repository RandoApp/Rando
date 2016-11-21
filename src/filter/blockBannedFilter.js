var logger = require("../log/logger");

function sendForbidden(res, ban) {
  var response = Errors.toResponse(Errors.Forbidden(ban));
  res.status(response.status).send(response);
}

module.exports = {
  run (req, res, next) {
    var user = req.lightUser;
    if (user.ban && Date.now() <= user.ban) {
      logger.warn("[blockBannedFilter, ", user.email, "] Banned user send request. Ban to: ", user.ban);
      return sendForbidden(res, user.ban);
    }
    return next();
  }
};

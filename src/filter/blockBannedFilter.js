var logger = require("../log/logger");

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

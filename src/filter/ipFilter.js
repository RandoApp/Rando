var logger = require("../log/logger");

function run (req, res, next) {
  logger.info("Start ipFilter for user:", req.lightUser.email);
  req.lightUser.ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  next();
}

module.exports = {
  run
};

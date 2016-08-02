var logger = require("../log/logger");
var crypto = require("crypto");
var config = require("config");

module.exports = {
  generateHashForPassword (email, password) {
    logger.data("[password.generateHashForPassword, ", email, "] Try generate hash.");
    var sha1sum = crypto.createHash("sha1");
    sha1sum.update(password + email + config.app.secret);
    return sha1sum.digest("hex");
  },
  isPasswordCorrect (password, user) {
    logger.data("[userService.isPasswordCorrect, ", user.email, "] Try compare passwords: ", user.password, " === ", this.generateHashForPassword(user.email, password));
    return user.password === this.generateHashForPassword(user.email, password);
  }
};

var logger = require("../log/logger");
var crypto = require("crypto");

module.exports = {
  generateHashForPassword: function (email, password, sold) {
    logger.data("[password.generateHashForPassword, ", email, "] Try generate hash.");
    var sha1sum = crypto.createHash("sha1");
    sha1sum.update(password + email + sold);
    return sha1sum.digest("hex");
  },
  isPasswordCorrect: function (password, user) {
    logger.data("[userService.isPasswordCorrect, ", user.email, "] Try compare passwords: ", user.password, " == ", this.generateHashForPassword(user.email, password));
    return user.password == this.generateHashForPassword(user.email, password);
  }
};

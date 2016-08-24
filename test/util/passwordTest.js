var should = require("should");
var sinon = require("sinon");
var passwordUtil = require("../../src/util/password");
var config = require("config");

describe("Password Util.", function () {
  config.app.secret = "STUB";
  describe("Is password correct.", function () {
    it("Same passwords return true", function (done) {
      var user = {
        email: "user@mail.com",
        password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5" //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
      };

      var actual = passwordUtil.isPasswordCorrect("passwordForSha1", user, "STUB");
      actual.should.be.true();
      done();
    });

    it("Differents passwords return false", function (done) {
      var user = {
        email: "user@mail.com",
        password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5" //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
      };

      var actual = passwordUtil.isPasswordCorrect("differentPassword", user, "STUB");
      actual.should.be.false();
      done();
    });
  });

  describe("Generate Hash for password.", function () {
    it("Sha1 algorithm should work", function (done) {
      var expected = "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5"; //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
      var actual = passwordUtil.generateHashForPassword("user@mail.com", "passwordForSha1", "STUB");
      actual.should.be.equal(expected);
      done();
    });
  });
});

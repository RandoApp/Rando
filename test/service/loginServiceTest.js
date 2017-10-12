const should = require("should");
const sinon = require("sinon");
const loginService = require("../../src/service/loginService");
const Errors = require("../../src/error/errors");
const db = require("randoDB");
const passwordUtil = require("../../src/util/password");
const mockUtil = require("../mockUtil");

describe("Login service.", () => {
  describe("Login As Rando User.", () => {
    afterEach(() => {
      mockUtil.clean(db);
      mockUtil.clean(passwordUtil);
    });

    it("Should return error when email is invalid", () => {
      loginService.loginRandoUser("this is not email", "", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Empty email should return Error", () => {
      loginService.loginRandoUser("", "password", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Empty password should return Error", () => {
      loginService.loginRandoUser("this@is.email", "", "127.0.0.1", "FireBaseInstanceId", (err) => {
        should.exist(err);
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Undefined email should return Error", () => {
      loginService.loginRandoUser(null, "", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Undefined password should return Error", () => {
      loginService.loginRandoUser("this@is.email", null, "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Correct email and password should not return Error", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback();
      });

      sinon.stub(db.user, "create", (user, callback) => {
        callback();
      });

      loginService.loginRandoUser("user@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", (err) => {
        should.not.exist(err);
        done();
      });
    });

    it("Data base error should return error", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(new Error("Db error"));
      });

      loginService.loginRandoUser("email@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Differents passwords should return error", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          email: "user@mail.com",
          password: "different"
        });
      });

      loginService.loginRandoUser("user@mail.com", "password2", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
        done();
      });
    });

    it("Same passwords should return user", (done) => {
      sinon.stub(passwordUtil, "isPasswordCorrect", (password, user, salt) => {
        should.exist(user);
        user.email.should.be.eql("user@mail.com");
        return true;
      });

      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          email: "user@mail.com",
          password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5", //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
          authToken: "",
          ip: "",
          firebaseInstanceIds: []
        });
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, meta, callback) => {
        callback();
      });

      loginService.loginRandoUser("user@mail.com", "passwordForSha1", "127.0.0.1", "FireBaseInstanceId", (err, response) => {
        should.not.exist(err);
        response.should.have.property("token");
        response.token.should.not.be.empty();
        done();
      });
    });

    it("New user should be created in data base and return token", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", function(email, callback) {
        callback();
      });

      sinon.stub(db.user, "create", (email, callback) => {
        callback();
      });

      loginService.loginRandoUser("email@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", (err, response) => {
        should.not.exist(err);
        response.should.have.property("token");
        response.token.should.not.be.empty();
        done();
      });
    });
  });

  describe("Login as Google User.", () => {
    afterEach(() => {
      mockUtil.clean(db);
    });

    it("Should return GoogleIncorrectArgs when no email from google", (done) => {
      loginService.loginGoogleUser("googleId", null, "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.GoogleIncorrectArgs().rando);
        done();
      });
    });

    it("Should return GoogleIncorrectArgs when no googleId sent", (done) => {
      loginService.loginGoogleUser(null, "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.GoogleIncorrectArgs().rando);
        done();
      });
    });

    it("Should return System Error when getByEmail Database call errors", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(new Error("Data base error"));
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Should return System Error when user.update Database call errors", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          user: "user@mail.com"
        });
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, meta, callback) => {
        callback(new Error("Data base error"));
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Should return System Error when exist use. Database call errors", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          user: "user@mail.com"
        });
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, meta, callback) => {
        callback(new Error("Data base error"));
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Should return System Error when new user need to be created and.create Database call errors", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback();
      });

      sinon.stub(db.user, "create", (user, callback) => {
        callback(new Error("Data base error"));
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Should find and return authToken for existing user", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          user: "user@mail.com"
        });
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, meta, callback) => {
        should.exist(email);
        should.exist(meta);
        meta.firebaseInstanceIds.length.should.be.eql(1);
        meta.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
        meta.firebaseInstanceIds[0].active.should.be.true();
        callback(null, {
          token: "auttoken123"
        });
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err, userId) => {
        should.not.exist(err);
        should.exist(userId);
        done();
      });
    });

    it("Should create user when valid google data is passed and ther is no such user before", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback();
      });

      sinon.stub(db.user, "create", (user, callback) => {
        callback();
      });

      loginService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", (err, userId) => {
        should.not.exist(err);
        should.exist(userId);
        done();
      });
    });
  });

  describe("Login As Anonymouse.", () => {
    afterEach(() => {
      mockUtil.clean(db);
    });

    it("Not defined id should return error", (done) => {
      loginService.loginAnonymous(null, "127.0.0.1", "FireBaseInstanceId", (err, response) => {
        should.exist(err);
        err.should.have.property("message", "Id is not correct");
        should.not.exist(response);
        done();
      });
    });

    it("Error in database should return system error", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", function(email, callback) {
        callback(new Error("Data base error"));
      });

      loginService.loginAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", (err, response) => {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        should.not.exist(response);
        done();
      });
    });

    it("Anonymous user already exists", (done) => {
      sinon.stub(db.user, "getLightUserByEmail", (email, callback) => {
        callback(null, {
          email: "efab3c3@rando4.me",
          authToken: "12312j1k2j3o12j31",
          password: "123",
          googleId: null,
          firebaseInstanceIds: []
        });
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, meta, callback) => {
        should.exist(email);
        should.exist(meta);
        meta.firebaseInstanceIds.length.should.be.eql(1);
        meta.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
        meta.firebaseInstanceIds[0].active.should.be.true();
        callback();
      });

      loginService.loginAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", (err, response) => {
        should.not.exist(err);
        response.should.have.property("token");
        response.token.should.not.be.empty();
        done();
      });
    });

    it("Anonymous should be created in database if not found", function(done) {
      sinon.stub(db.user, "getLightUserByEmail", function(email, callback) {
        callback();
      });

      sinon.stub(db.user, "create", function(user, callback) {
        user.should.have.property("email", "efab3c3@rando4.me");
        user.should.have.property("anonymousId", "efab3c3");
        user.firebaseInstanceIds.length.should.be.eql(1);
        user.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
        user.firebaseInstanceIds[0].active.should.be.true();
        callback();
      });

      loginService.loginAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
        should.not.exist(err);
        response.should.have.property("token");
        response.token.should.not.be.empty();
        done();
      });

    });
  });


  describe("Destroy auth token.", function() {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("AuthToken should be destroyed from user in db and return logout done as result", function(done) {
      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        callback();
      });

      sinon.stub(db.user, "updateActiveForAllFirabaseIdsByEmail", function(email, value, callback) {
        callback();
      });

      loginService.destroyAuthToken("user@mail.com", function(err, result) {
        should.not.exist(err);

        result.should.be.eql({
          command: "logout",
          result: "done"
        });

        done();
      });
    });

    it("Should fail and return 500 when error thrown in destroyAuthToken", function(done) {
      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        callback(new Error("DB error"));
      });

      loginService.destroyAuthToken("user@mail.com", function(err, result) {
        should.exist(err);
        should.not.exist(result);
        err.should.have.property("message", "DB error");
        done();
      });
    });
  });

});

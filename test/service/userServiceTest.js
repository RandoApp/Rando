var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var Errors = require("../../src/error/errors");
var db = require("randoDB");
var passwordUtil = require("../../src/util/password");
var mockUtil = require("../mockUtil");

describe("User service.", function () {
  describe("Find or create user by login and password.", function () {
    it("Should return error when email is invalid", function () {
      userService.findOrCreateByLoginAndPassword("this is not email", "", "127.0.0.1", "FireBaseInstanceId", function (err) {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Empty email should return Error", function () {
      userService.findOrCreateByLoginAndPassword("", "password", "127.0.0.1","FireBaseInstanceId", function (err) {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Empty password should return Error", function () {
      userService.findOrCreateByLoginAndPassword("this@is.email", "", "127.0.0.1", "FireBaseInstanceId", function (err) {should.exist(err);
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Undefined email should return Error", function () {
      userService.findOrCreateByLoginAndPassword(null, "", "127.0.0.1", "FireBaseInstanceId", function (err) {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Undefined password should return Error", function () {
      userService.findOrCreateByLoginAndPassword("this@is.email", null, "127.0.0.1", "FireBaseInstanceId", function (err) {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
      });
    });

    it("Correct email and password should not return Error", function (done) {
      sinon.stub(db.user, "getByEmail", function (email, callback) {
        db.user.getByEmail.restore();
        callback();
      });

      sinon.stub(db.user, "create", function (user, callback) {
        db.user.create.restore();
        callback();
      });

      userService.findOrCreateByLoginAndPassword("user@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", function (err) {
        should.not.exist(err);
        done();
      });
    });

    it("Data base error should return error", function (done) {
      sinon.stub(db.user, "getByEmail", function (email, callback) {
        db.user.getByEmail.restore();
        callback(new Error("Db error"));
      });

      userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", function (err) {
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Differents passwords should return error", function (done) {
      sinon.stub(db.user, "getByEmail", function (email, callback) {
        db.user.getByEmail.restore();
        callback(null, {email: "user@mail.com", password: "different"});
      });

      userService.findOrCreateByLoginAndPassword("user@mail.com", "password2", "127.0.0.1", "FireBaseInstanceId", function (err) {
        err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
        done();
      });
    });

    it("Same passwords should return user", function (done) {
      sinon.stub(passwordUtil, "isPasswordCorrect", function (password, user, salt) {
        passwordUtil.isPasswordCorrect.restore();
        should.exist(user);
        user.email.should.be.eql("user@mail.com");
        return true;
      });

      sinon.stub(db.user, "getByEmail", function (email, callback) {
        db.user.getByEmail.restore();
        callback(null, {
          email: "user@mail.com",
                    password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5", //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
                    authToken: "",
                    ip: "",
                    firebaseInstanceIds: []
                  });
      });

      sinon.stub(db.user, "update", function (user, callback) {
        db.user.update.restore();
        callback();
      });

      userService.findOrCreateByLoginAndPassword("user@mail.com", "passwordForSha1", "127.0.0.1", "FireBaseInstanceId", function (err, response) {
        should.not.exist(err);
        response.should.have.property("token");
        response.token.should.not.be.empty();
        done();
      });
    });

it("New user should be created in data base and return token", function (done) {
  sinon.stub(db.user, "getByEmail", function (email, callback) {
    db.user.getByEmail.restore();
    callback();
  });

  sinon.stub(db.user, "create", function (email, callback) {
    db.user.create.restore();
    callback();
  });

  userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", "FireBaseInstanceId", function (err, response) {
    should.not.exist(err);
    response.should.have.property("token");
    response.token.should.not.be.empty();
    done();
  });
});
});

describe("Find or create by FB data.", function () {
  it("Wrong data without email from facebook", function (done) {
    userService.findOrCreateByFBData({email: null, ip: "127.0.0.1", firebaseInstanceId: "FireBaseInstanceId"}, function (err) {
      err.rando.should.be.eql(Errors.FBIncorrectArgs().rando);
      done();
    });

  });

  it("No data from facebook", function (done) {
    userService.findOrCreateByFBData(null, function (err) {
      err.rando.should.be.eql(Errors.FBIncorrectArgs().rando);
      done();
    });
  });
  it("Database error", function (done) {
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(new Error("Data base error"));
    });

    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1", firebaseInstanceId: "FireBaseInstanceId"}, function (err) {
      err.rando.should.be.eql(Errors.System(new Error()).rando);
      done();
    });
  });
  it("User exist", function (done) {
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(null, {user: "user@mail.com"});
    });

    sinon.stub(db.user, "update", function (user, callback) {
      db.user.update.restore();
      callback(null, {token: "auttoken123"});
    });

    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1", firebaseInstanceId: "FireBaseInstanceId"}, function (err, userId) {
      should.not.exist(err);
      should.exist(userId);
      done();
    });
  });
  it("Create user", function (done) {
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback();
    });

    sinon.stub(db.user, "create", function (user, callback) {
      db.user.create.restore();
      callback();
    });

    userService.findOrCreateByFBData({email: "user@mail.com", id: "23131231", ip: "127.0.0.1", firebaseInstanceId: "FireBaseInstanceId"}, function (err, userId) {
      should.not.exist(err);
      should.exist(userId);
      done();
    });
  });
});

describe("Find or create by Google data.", function () {
  it("Should return GoogleIncorrectArgs when no email from google", function (done) {
    var isCallbackCalled = false;
    userService.findOrCreateByGoogleData("googleId",null, "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.GoogleIncorrectArgs().rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should return GoogleIncorrectArgs when no googleId sent", function (done) {
    var isCallbackCalled = false;
    userService.findOrCreateByGoogleData(null, "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.GoogleIncorrectArgs().rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should return System Error when getByEmail Database call errors", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(new Error("Data base error"));
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.System(new Error()).rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

    it("Should return System Error when user.update Database call errors", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(null, {user: "user@mail.com"});
    });

    sinon.stub(db.user, "update", function (email, callback) {
      db.user.update.restore();
      callback(new Error("Data base error"));
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.System(new Error()).rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should return System Error when new user need to be created and.create Database call errors", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(null, {user: "user@mail.com"});
    });

    sinon.stub(db.user, "update", function (email, callback) {
      db.user.update.restore();
      callback(new Error("Data base error"));
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.System(new Error()).rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should return System Error when new user need to be created and.create Database call errors", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback();
    });

    sinon.stub(db.user, "create", function (email, callback) {
      db.user.create.restore();
      callback(new Error("Data base error"));
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err) {
      isCallbackCalled = true;
      err.rando.should.be.eql(Errors.System(new Error()).rando);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should find and return authToken for existing user", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback(null, {user: "user@mail.com"});
    });

    sinon.stub(db.user, "update", function (user, callback) {
      db.user.update.restore();
      should.exist(user);
      user.firebaseInstanceIds.length.should.be.eql(1);
      user.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
      user.firebaseInstanceIds[0].active.should.be.true();
      callback(null, {token: "auttoken123"});
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err, userId) {
      isCallbackCalled = true;
      should.not.exist(err);
      should.exist(userId);
      done();
    });
    isCallbackCalled.should.be.true();
  });

  it("Should create user when valid google data is passed and ther is no such user before", function (done) {
    var isCallbackCalled = false;
    sinon.stub(db.user, "getByEmail", function (email, callback) {
      db.user.getByEmail.restore();
      callback();
    });

    sinon.stub(db.user, "create", function (user, callback) {
      db.user.create.restore();
      callback();
    });

    userService.findOrCreateByGoogleData("googleId", "email@email.com", "127.0.0.1", "FireBaseInstanceId", function (err, userId) {
      isCallbackCalled = true;
      should.not.exist(err);
      should.exist(userId);
      done();
    });
    isCallbackCalled.should.be.true();
  });
});

  describe("Get user.", function () {
    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Get user successfully", function (done) {
      sinon.stub(db.user, "getAllLightInAndOutRandosByEmail", function (email, callback) {
        callback(null, {
          out: [
            {randoId: 1, delete: 0, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}, strangerMapURL: "url", strangerMapSizeURL: {large: "largeUrl", medium: "mediumUrl", small: "smallUrl"}},
            {randoId: 2, delete: 1, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}, strangerMapURL: "url", strangerMapSizeURL: {large: "largeUrl", medium: "mediumUrl", small: "smallUrl"}},
            {randoId: 3, delete: 0, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}, strangerMapURL: "url", strangerMapSizeURL: {large: "largeUrl", medium: "mediumUrl", small: "smallUrl"}}
          ],
          in: [
            {randoId: 9, delete: 0, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}},
            {randoId: 8, delete: 1, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}},
            {randoId: 7, delete: 0, mapURL: "mapURL", mapSizeURL: {large: "largeMapUrl", medium: "mediumUMaprl", small: "smallMapUrl"}}
          ]
        });
      });

      userService.getUser("user@mail.com", function (err, user) {
        should.not.exist(err);
        should.exist(user);
        user.should.have.property("email", "user@mail.com");
        user.out.should.not.be.empty();
        user.in.should.not.be.empty();
        done();
      });
    });
  });


    describe("Find Or Create Anonymouse.", function () {
      it("Not defined id should return error", function (done) {
        userService.findOrCreateAnonymous(null, "127.0.0.1", "FireBaseInstanceId", function (err, response) {
          should.exist(err);
          err.should.have.property("message", "Id is not correct");
          should.not.exist(response);
          done();
        });
      });

      it("Error in database should return system error", function (done) {
        sinon.stub(db.user, "getByEmail", function (email, callback) {
          db.user.getByEmail.restore();
          callback(new Error("Data base error"));
        });

        userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
          err.rando.should.be.eql(Errors.System(new Error()).rando);
          should.not.exist(response);
          done();
        });
      });

      it("Anonymous user already exists", function (done) {
        sinon.stub(db.user, "getByEmail", function (email, callback) {
          db.user.getByEmail.restore();
          callback(null, {
            email: "efab3c3@rando4.me",
            authToken: "12312j1k2j3o12j31",
            firebaseInstanceIds:[]
          });
        });

        sinon.stub(db.user, "update", function (user, callback) {
          db.user.update.restore();
          should.exist(user);
          user.firebaseInstanceIds.length.should.be.eql(1);
          user.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
          user.firebaseInstanceIds[0].active.should.be.true();
          callback();
        });

        var isCallbackCalled = false;
        userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
          isCallbackCalled = true;
          should.not.exist(err);
          response.should.have.property("token");
          response.token.should.not.be.empty();
        });
        isCallbackCalled.should.be.true();
        done();
      });
      
      it("Anonymous should be created in database if not found", function (done) {
        sinon.stub(db.user, "getByEmail", function (email, callback) {
          db.user.getByEmail.restore();
          callback();
        });

        sinon.stub(db.user, "create", function (user, callback) {
          db.user.create.restore();
          user.should.have.property("email", "efab3c3@rando4.me");
          user.should.have.property("anonymousId", "efab3c3");
          user.firebaseInstanceIds.length.should.be.eql(1);
          user.firebaseInstanceIds[0].instanceId.should.be.eql("FireBaseInstanceId");
          user.firebaseInstanceIds[0].active.should.be.true();
          callback();
        });

        userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
          should.not.exist(err);
          response.should.have.property("token");
          response.token.should.not.be.empty();
          done();
        });

      });
    });


describe("Destroy auth token.", function () {
  afterEach(function() {
    mockUtil.clean(db);
  });

  it("AuthToken should be destroyed from user in db and return logout done as result", function (done) {
    sinon.stub(db.user, "updateUserMetaByEmail", function (email, meta, callback) {
      callback();
    });

    sinon.stub(db.user, "updateActiveForAllFirabaseIdsByEmail", function (email, value, callback) {
      callback();
    });

    userService.destroyAuthToken("user@mail.com", function (err, result) {
      should.not.exist(err);

      result.should.be.eql({
        command: "logout",
        result: "done"
      });

      done();
    });
  });

   it("Should fail and return 500 when error thrown in destroyAuthToken", function (done) {
    sinon.stub(db.user, "updateUserMetaByEmail", function (email, meta, callback) {
      callback(new Error("DB error"));
    });
    
    userService.destroyAuthToken("user@mail.com", function (err, result) {
      should.exist(err);
      should.not.exist(result);
      err.should.have.property("message", "DB error");
      done();
    });
  });
});

describe("FirebaseInstanceId operations. ", function () {
  describe("AddOrUpdateFirebaseInstanceId: Positive flow. ", function () {
    it("Should add or update new FirebaseInstanceId or user doesn't have user.firebaseInstanceIds defined" , function (done) {
    var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken"
      };
    var isCallbackCalled = false;
    userService.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {

      should.not.exist(err);

      user.firebaseInstanceIds.length.should.be.eql(1);
      user.firebaseInstanceIds[0].instanceId.should.be.eql(firebaseInstanceId);
      user.firebaseInstanceIds[0].active.should.be.true();
      isCallbackCalled = true;
    });

    isCallbackCalled.should.be.true();

    done();
  });
  });

  describe("AddOrUpdateFirebaseInstanceId: Negative flow. ", function () {
     var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken",
      firebaseInstanceIds: [
    {
        instanceId: "firebaseInstanceId2",
        active: false,
        createdDate: 300,
        lastUsedDate: 400
    }]};

    it("Should not fail and return error to callback when user is passed and FirebaseInstanceId is undefined" , function (done) {
    var isCallbackCalled = false;
    userService.addOrUpdateFirebaseInstanceId(user, null, function (err, user) {
      should.exist(user);
      should.not.exist(err);
      user.should.have.property("authToken", "someToken");
      isCallbackCalled = true;
    });
    isCallbackCalled.should.be.true();
    done();
  });

    it("Should not fail and return error to callback when user is undefined and FirebaseInstanceId is passed" , function (done) {
    var isCallbackCalled = false;
    userService.addOrUpdateFirebaseInstanceId(null, firebaseInstanceId, function (err, user) {
      should.not.exist(user);
      err.should.be.eql("user should be present");
      isCallbackCalled = true;
    });
    isCallbackCalled.should.be.true();
    done();
  });

    it("Should not fail and return error to callback when user and FirebaseInstanceId are undefined" , function (done) {
    var isCallbackCalled = false;
    userService.addOrUpdateFirebaseInstanceId(null, null, function (err, user) {
      should.not.exist(user);
      err.should.be.eql("user should be present");
      isCallbackCalled = true;
    });
    isCallbackCalled.should.be.true();
    done();
    });

  });

});
});

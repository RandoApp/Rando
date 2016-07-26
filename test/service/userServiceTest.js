var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var Errors = require("../../src/error/errors");
var db = require("randoDB");
var passwordUtil = require("../../src/util/password");

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
      sinon.stub(passwordUtil, "isPasswordCorrect", function (password, user) {
        passwordUtil.isPasswordCorrect.restore();
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
        response.token.should.not.be.empty;
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
    response.token.should.not.be.empty;
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

    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err) {
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

    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err, userId) {
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

    userService.findOrCreateByFBData({email: "user@mail.com", id: "23131231", ip: "127.0.0.1"}, function (err, userId) {
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

    //TODO: !!!!!!!make assertion more strict!!!!!!!!
    describe("Get user.", function () {
      it("Get user successfully", function (done) {
        userService.getUser({email: "user@mail.com", out: [{randoId: 123}], in: [{randoId: 456}]}, function (err, user) {
          should.not.exist(err);
          should.exist(user);
    //TODO: make assertion more strongly;
    user.should.have.property("email", "user@mail.com");
    user.out.should.not.be.empty;
    user.in.should.not.be.empty;
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
          callback();
        });

        userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
          should.not.exist(err);
          response.should.have.property("token");
          response.token.should.not.be.empty;
          done();
        });
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
          callback();
        });

        userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", "FireBaseInstanceId", function(err, response) {
          should.not.exist(err);
          response.should.have.property("token");
          response.token.should.not.be.empty;
          done();
        });

      });
    });


describe("Destroy auth token.", function () {
  it("AuthToken should be destroyed from user in db and return logout done as result", function (done) {
    var isSaveCalled = false;
    var user = {
      authToken: "someToken",
      save: function () {
        isSaveCalled = true;
      },
      firebaseInstanceIds: [
    {
        instanceId: "firebaseInstanceId",
        active: true,
        createdDate: 300,
        lastUsedDate: 400
    }]
    }
    userService.destroyAuthToken(user, "firebaseInstanceId", function (err, result) {
      should.not.exist(err);
      isSaveCalled.should.be.true();
      user.authToken.should.be.empty;
      user.firebaseInstanceIds[0].instanceId.should.be.eql("firebaseInstanceId");
      user.firebaseInstanceIds[0].active.should.be.false();

      result.should.be.eql({
        command: "logout",
        result: "done"
      });

      done();
    });
  });
});

describe("FirebaseInstanceId operations. ", function () {

  it("Should deactivate FirebaseInstanceId and don't change others when id exists" , function (done) {
    var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken2",
      email: "FirebaseInstanceId1@email.com",
      firebaseInstanceIds: [{
        instanceId: firebaseInstanceId,
        active: true,
        createdDate: 100,
        lastUsedDate: 200
    },
    {
        instanceId: "firebaseInstanceId2",
        active: false,
        createdDate: 300,
        lastUsedDate: 400
    }]};

    userService.deactivateFirebaseInstanceId(user, firebaseInstanceId);

    user.firebaseInstanceIds.length.should.be.eql(2);
    user.firebaseInstanceIds[0].instanceId.should.be.eql(firebaseInstanceId);
    user.firebaseInstanceIds[0].active.should.be.false();
    user.firebaseInstanceIds[0].createdDate.should.be.eql(100);
    user.firebaseInstanceIds[0].lastUsedDate.should.not.be.eql(200);

    user.firebaseInstanceIds[1].instanceId.should.be.eql("firebaseInstanceId2");
    user.firebaseInstanceIds[1].active.should.be.false();
    user.firebaseInstanceIds[1].createdDate.should.be.eql(300);
    user.firebaseInstanceIds[1].lastUsedDate.should.be.eql(400);

    done();
  });

  it("Should add deactivated FirebaseInstanceId and don't change others when id is not in list" , function (done) {
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

    userService.deactivateFirebaseInstanceId(user,firebaseInstanceId);


    user.firebaseInstanceIds.length.should.be.eql(2);
    user.firebaseInstanceIds[0].instanceId.should.be.eql("firebaseInstanceId2");
    user.firebaseInstanceIds[0].active.should.be.false();
    user.firebaseInstanceIds[0].createdDate.should.be.eql(300);
    user.firebaseInstanceIds[0].lastUsedDate.should.be.eql(400);

    user.firebaseInstanceIds[1].instanceId.should.be.eql(firebaseInstanceId);
    user.firebaseInstanceIds[1].active.should.be.false();

    done();
  });

  it("Should not fail when FirebaseInstanceId or user is undefined" , function (done) {
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

    userService.deactivateFirebaseInstanceId(user, null);
    userService.deactivateFirebaseInstanceId(null, firebaseInstanceId);
    userService.deactivateFirebaseInstanceId(null, null);

    userService.addOrUpdateFirebaseInstanceId(user, null);
    userService.addOrUpdateFirebaseInstanceId(null, firebaseInstanceId);
    userService.addOrUpdateFirebaseInstanceId(null, null);

    done();
  });

    it("Should add or update new FirebaseInstanceId or user doesn't have user.firebaseInstanceIds defined" , function (done) {
    var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken"
      };

    userService.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId);

    user.firebaseInstanceIds.length.should.be.eql(1);
    user.firebaseInstanceIds[0].instanceId.should.be.eql(firebaseInstanceId);
    user.firebaseInstanceIds[0].active.should.be.true();

    done();
  });

  it("Should deactivate FirebaseInstanceId or user doesn't have user.firebaseInstanceIds defined" , function (done) {
    var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken"
      };

    userService.deactivateFirebaseInstanceId(user, firebaseInstanceId);

    user.firebaseInstanceIds.length.should.be.eql(1);
    user.firebaseInstanceIds[0].instanceId.should.be.eql(firebaseInstanceId);
    user.firebaseInstanceIds[0].active.should.be.false();

    done();
  });

});

});

const should = require("should");
const firebaseService = require("../../src/service/firebaseService");

describe("FirebaseInstanceId operations. ", function() {
  describe("AddOrUpdateFirebaseInstanceId: Positive flow. ", function() {
    it("Should add or update new FirebaseInstanceId or user doesn't have user.firebaseInstanceIds defined", function(done) {
      var firebaseInstanceId = "FirebaseInstanceId1";
      var user = {
        authToken: "someToken"
      };
      var isCallbackCalled = false;
      firebaseService.addOrUpdateFirebaseInstanceIdOnUser(user, firebaseInstanceId, function(err, user) {

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

  describe("AddOrUpdateFirebaseInstanceId: Negative flow. ", function() {
    var firebaseInstanceId = "FirebaseInstanceId1";
    var user = {
      authToken: "someToken",
      firebaseInstanceIds: [{
        instanceId: "firebaseInstanceId2",
        active: false,
        createdDate: 300,
        lastUsedDate: 400
      }]
    };

    it("Should not fail and return error to callback when user is passed and FirebaseInstanceId is undefined", function(done) {
      var isCallbackCalled = false;
      firebaseService.addOrUpdateFirebaseInstanceIdOnUser(user, null, function(err, user) {
        should.exist(user);
        should.not.exist(err);
        user.should.have.property("authToken", "someToken");
        isCallbackCalled = true;
      });
      isCallbackCalled.should.be.true();
      done();
    });

    it("Should not fail and return error to callback when user is undefined and FirebaseInstanceId is passed", function(done) {
      var isCallbackCalled = false;
      firebaseService.addOrUpdateFirebaseInstanceIdOnUser(null, firebaseInstanceId, function(err, user) {
        should.not.exist(user);
        err.should.be.eql("user should be present");
        isCallbackCalled = true;
      });
      isCallbackCalled.should.be.true();
      done();
    });

    it("Should not fail and return error to callback when user and FirebaseInstanceId are undefined", function(done) {
      var isCallbackCalled = false;
      firebaseService.addOrUpdateFirebaseInstanceIdOnUser(null, null, function(err, user) {
        should.not.exist(user);
        err.should.be.eql("user should be present");
        isCallbackCalled = true;
      });
      isCallbackCalled.should.be.true();
      done();
    });

  });

});

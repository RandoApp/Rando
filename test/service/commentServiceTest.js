var should = require("should");
var sinon = require("sinon");
var config = require("config");
var commentService = require("../../src/service/commentService");
const pushNotificationService = require("../../src/service/pushNotificationService");
var db = require("randoDB");
var Errors = require("../../src/error/errors");
var mockUtil = require("../mockUtil");

describe("Comment service.", function () {
  describe("Delete.", function () {

    afterEach(function() {
      mockUtil.clean(db);
      mockUtil.clean(pushNotificationService);
    });

    it("Delete flag should be set to 1 in out by calling db.user.updateOutRandoProperties", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateOutRandoProperties", function (email, randoId, deleteFlag, callback) {
        done();
      });

      commentService.delete(user, 456, function (err, response) {/*doesn't matter*/});
    });

    it("Delete flag should be set to 1 in in by calling db.user.updateInRandoProperties", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateInRandoProperties", function (email, randoId, deleteFlag, callback) {
        done();
      });

      commentService.delete(user, 789, function (err, response) {/*doesn't matter*/});
    });

    it("Should return system error when db return error", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateOutRandoProperties", function (email, randoId, deleteFlag, callback) {
        callback(new Error("Some db error"));
      });

      commentService.delete(user, 123, function (err, response) {
        err.should.be.eql(Errors.System(new Error("Some db error")));
        done();
      });
    });

    it("Service should return json response if all ok", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateOutRandoProperties", function (email, randoId, deleteFlag, callback) {
        callback();
      });

      sinon.stub(db.user, "updateInRandoProperties", function (email, randoId, deleteFlag, callback) {
        callback();
      });

      commentService.delete(user, 123, function (err, response) {
        response.should.be.eql({command: "delete", result: "done"});
        done();
      });
    });
  });

  describe("Rate.", function () {
    
    var user = {
      email: "user@mail.com",
      out:[{randoId: 123, delete: 0, rating: 0}, {randoId: 456, delete: 0, rating:0}],
      in:[{randoId: 789, delete: 0, rating: 0, creation: 100,  detected:["bla"], imageSizeURL: "imageSizeURLValue", imageURL: "imageURLValue",mapSizeURL: "mapSizeURLValueIN", mapURL: "mapURLValueIN"  }, {randoId: 999, delete: 0, rating : 0}]
      };

      var user2 = {
      email: "user2@mail.com",
      in:[{randoId: 123, delete: 0, rating: 0}, {randoId: 456, delete: 0, rating:0}],
      out:[{randoId: 789, delete: 0, rating: 0, creation: 100,  detected:["bla"], imageSizeURL: "imageSizeURLValue", imageURL: "imageURLValue",mapSizeURL: "mapSizeURLValueOUT", mapURL: "mapURLValueOUT"  }, {randoId: 999, delete: 0, rating : 0}]
      };

    before((done) => {
      db.connect(config.db.url, done);
    });

    after((done) => {
      db.disconnect(done);
    });

    beforeEach(function(done) {
      db.user.create(user, (err)=>{
        db.user.create(user2,done);
      }
        );
      });

    afterEach((done) => {
      db.user.removeAll(done);
      mockUtil.clean(db);
    });

    it("Rate should return Errors.IncorrectArgs when \"rating\" is lower than 1", function (done) {
      commentService.rate(user, 789, 0, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Rate should return Errors.IncorrectArgs when \"rating\" is greater than 3", function (done) {
      commentService.rate(user, 789, 4, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Rate flag should return Errors.IncorrectArgs when \"rating\" can't be parsed to number", function (done) {
      sinon.stub(db.user, "updateInRandoProperties", function (email, randoId, deleteFlag, callback) {
        done();
      });

      commentService.rate(user, 789, "Not a number", (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Should return system error when db return error", function (done) {
      sinon.stub(db.user, "getLightUserMetaByOutRandoId", function (randoId, callback) {
        callback(new Error("Some db error"));
      });

      commentService.rate(user, 789, 3, (err, response) => {
        should.exist(err);
        err.message.should.be.eql("Some db error");
        done();
      });
    });

    it("Should return Errors.IncorrectArgs when user rates himself", function (done) {
      commentService.rate(user, 456, 3, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());  
        done();
      });
    });

     it("Should set rating correctly for both users when user rates rando in his IN", function (done) {
      sinon.stub(pushNotificationService, "sendMessageToAllActiveUserDevices", function (message,stranger, callback) {
        should.exist(message);
        message.notificationType.should.be.eql("rated");
        should.exist(message.rando);
        should(message).be.eql("");
        should(message.rando.randoId).be.eql(789);
        should(message.rando.rating).be.eql(3);
        should(message.rando.creation).be.eql(100);
        should(message.rando.imageSizeURL).be.eql("imageSizeURLValue");
        should(message.rando.imageURL).be.eql("imageURLValue");
        should(message.rando.detected).be.eql(["bla"]);
        should(message.rando.mapSizeURL).be.eql("mapSizeURLValueIN");
        should(message.rando.mapURL).be.eql("mapURLValueIN");
        should.exist(stranger);
        stranger.email.should.be.eql("user2@mail.com");
        callback();
      });

      commentService.rate(user, 789, 3, (err, response) => {
        should.not.exist(err);
        should.exist(response);
        response.command.should.be.eql("rate");
        response.result.should.be.eql("done");
        //db.user.getLightUserWithInAndOutByEmail(user.email, ()
        done();
      });
    });
  });
});


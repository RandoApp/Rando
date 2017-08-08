var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var db = require("randoDB");
var Errors = require("../../src/error/errors");
var mockUtil = require("../mockUtil");

describe("Comment service.", function () {
    describe("Rate.", function () {

    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Rate should return Errors.IncorrectArgs when rating is lower than 1", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      commentService.rate(user, 789, 0, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Rate should return Errors.IncorrectArgs when rating is greater than 3", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      commentService.rate(user, 789, 4, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Rate flag should return Errors.IncorrectArgs when rating ", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateInRandoProperties", function (email, randoId, deleteFlag, callback) {
        done();
      });

      commentService.rate(user, 789, 3, (err, response) => {
        should.exist(err);
        err.should.be.eql(Errors.IncorrectArgs());
        done();
      });
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

});

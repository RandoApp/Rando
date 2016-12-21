var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var db = require("randoDB");
var Errors = require("../../src/error/errors");
var mockUtil = require("../mockUtil");

describe("Comment service.", function () {
  describe("Delete.", function () {

    afterEach(function() {
      mockUtil.clean(db);
    });

    it("Delete flag should be set to 1 in out by calling db.user.updateDeleteFlagForOutRando", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateDeleteFlagForOutRando", function (email, randoId, deleteFlag, callback) {
        done();
      });

      commentService.delete(user, 456, function (err, response) {/*doesn't matter*/});
    });

    it("Delete flag should be set to 1 in in by calling db.user.updateDeleteFlagForInRando", function (done) {
      var user = {
        email: "user@mail.com",
        out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
        in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
      };

      sinon.stub(db.user, "updateDeleteFlagForInRando", function (email, randoId, deleteFlag, callback) {
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

      sinon.stub(db.user, "updateDeleteFlagForOutRando", function (email, randoId, deleteFlag, callback) {
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

      sinon.stub(db.user, "updateDeleteFlagForOutRando", function (email, randoId, deleteFlag, callback) {
        callback();
      });

      sinon.stub(db.user, "updateDeleteFlagForInRando", function (email, randoId, deleteFlag, callback) {
        callback();
      });

      commentService.delete(user, 123, function (err, response) {
        response.should.be.eql({command: "delete", result: "done"});
        done();
      });
    });
  });
});

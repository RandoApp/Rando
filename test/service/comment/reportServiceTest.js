var should = require("should");
var sinon = require("sinon");
var config = require("config");
var reportService = require("../../../src/service/comment/reportService");
var db = require("@rando4.me/db");
var mockUtil = require("../../mockUtil");

describe("Comment/ReportService.", function() {
  describe("report.", function() {

    beforeEach(() => {
      mockUtil.clean(db);
      mockUtil.clean(Date.now);
    });

    afterEach(() => {
      mockUtil.clean(db);
      mockUtil.clean(Date.now);
    });

    it("Should set report=1 on good user rando and Push new report event for bad user", function(done) {
      const NOW = 16 * 1000;

      var goodUser = {
        email: "good@rando4.me",
        out: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 456,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 9991,
          delete: 0,
          report: 0
        }]
      };

      var badUser = {
        email: "bad@rando4.me",
        out: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 654,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 9992,
          delete: 0,
          report: 0
        }]
      };

      sinon.stub(Date, "now", () => {
        return NOW;
      });

      sinon.stub(db.user, "getLightUserMetaByOutRandoId", function(reporedRandoId, callback) {
        callback(null, badUser);
      });


      sinon.stub(db.user, "updateInRandoProperties", function(email, randoId, reportFlag, callback) {
        email.should.be.eql("good@rando4.me");
        randoId.should.be.eql(321);
        reportFlag.should.be.eql({
          report: 1
        });
        callback();
      });

      sinon.stub(db.user, "addReportForUser", function(email, reportData, callback) {
        email.should.be.eql("bad@rando4.me");
        reportData.should.be.eql({
          reportedBy: "good@rando4.me",
          randoId: 321,
          reportedDate: NOW,
          reason: "Reported by good@rando4.me because randoId: 321"
        });
        callback();
      });

      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        callback();
      });

      reportService.report(goodUser, 321, function(err, response) {
        done();
      });
    });

    it("Should ban badUser when bad user has 3 report events by last 2 weeks made by 3 unic users", function(done) {
      const NOW = 16 * 1000;

      var goodUser = {
        email: "gooduser1@rando4.me",
        out: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 456,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 9991,
          delete: 0,
          report: 0
        }]
      };

      var badUser = {
        email: "bad@rando4.me",
        out: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 654,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 9992,
          delete: 0,
          report: 0
        }],
        report: [{
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: 14 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser2@rando4.me because randoId: 654",
          reportedDate: 13 * 1000,
          randoId: "654",
          reportedBy: "gooduser2@rando4.me",
        }, {
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: 12 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser4@rando4.me because randoId: 321",
          reportedDate: 11 * 1000,
          randoId: "321",
          reportedBy: "gooduser4@rando4.me",
        }],
      };

      sinon.stub(Date, "now", () => {
        return NOW;
      });

      sinon.stub(db.user, "getLightUserMetaByOutRandoId", function(reporedRandoId, callback) {
        callback(null, badUser);
      });


      sinon.stub(db.user, "updateInRandoProperties", function(email, randoId, reportFlag, callback) {
        callback();
      });

      sinon.stub(db.user, "addReportForUser", function(email, reportData, callback) {
        callback();
      });

      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        email.should.be.eql("bad@rando4.me");

        meta.should.be.eql({
          ban: config.app.limit.permanentBanTo
        });
        done();
      });

      reportService.report(goodUser, 321, function(err, response) {
        // db.user.updateUserMetaByEmail should be triggered with test assertions
      });
    });

    it("Should ban badUser when bad user has 3 report events by last 2 weeks made by 3 unic users when one of report event is too old", function(done) {
      const NOW = Date.now();

      var goodUser = {
        email: "gooduser1@rando4.me",
        out: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 456,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 9991,
          delete: 0,
          report: 0
        }]
      };

      var badUser = {
        email: "bad@rando4.me",
        out: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 654,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 9992,
          delete: 0,
          report: 0
        }],
        report: [{
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: NOW - 21 * 24 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser2@rando4.me because randoId: 654",
          reportedDate: NOW - 14 * 24 * 60 * 60 * 1000,
          randoId: "654",
          reportedBy: "gooduser2@rando4.me",
        }, {
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: NOW - 12 * 24 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser4@rando4.me because randoId: 321",
          reportedDate: NOW - 4 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser4@rando4.me",
        }],
      };

      sinon.stub(Date, "now", () => {
        return NOW;
      });

      sinon.stub(db.user, "getLightUserMetaByOutRandoId", function(reporedRandoId, callback) {
        callback(null, badUser);
      });


      sinon.stub(db.user, "updateInRandoProperties", function(email, randoId, reportFlag, callback) {
        callback();
      });

      sinon.stub(db.user, "addReportForUser", function(email, reportData, callback) {
        callback();
      });

      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        email.should.be.eql("bad@rando4.me");

        meta.should.be.eql({
          ban: config.app.limit.permanentBanTo
        });
        done();
      });

      reportService.report(goodUser, 321, function(err, response) {
        // db.user.updateUserMetaByEmail should be triggered with test assertions
      });
    });


    it("Should NOT ban badUser when report events are too old", function(done) {
      const NOW = Date.now();

      var goodUser = {
        email: "gooduser1@rando4.me",
        out: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 456,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 9991,
          delete: 0,
          report: 0
        }]
      };

      var badUser = {
        email: "bad@rando4.me",
        out: [{
          randoId: 321,
          delete: 0,
          report: 0
        }, {
          randoId: 654,
          delete: 0,
          report: 0
        }],
        in: [{
          randoId: 123,
          delete: 0,
          report: 0
        }, {
          randoId: 9992,
          delete: 0,
          report: 0
        }],
        report: [{
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: NOW - 21 * 24 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser2@rando4.me because randoId: 654",
          reportedDate: NOW - 20 * 24 * 60 * 60 * 1000,
          randoId: "654",
          reportedBy: "gooduser2@rando4.me",
        }, {
          reason: "Reported by gooduser1@rando4.me because randoId: 321",
          reportedDate: NOW - 19 * 24 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser1@rando4.me",
        }, {
          reason: "Reported by gooduser4@rando4.me because randoId: 321",
          reportedDate: NOW - 4 * 60 * 60 * 1000,
          randoId: "321",
          reportedBy: "gooduser4@rando4.me",
        }],
      };

      sinon.stub(Date, "now", () => {
        return NOW;
      });

      sinon.stub(db.user, "getLightUserMetaByOutRandoId", function(reporedRandoId, callback) {
        callback(null, badUser);
      });


      sinon.stub(db.user, "updateInRandoProperties", function(email, randoId, reportFlag, callback) {
        callback();
      });

      sinon.stub(db.user, "addReportForUser", function(email, reportData, callback) {
        callback();
      });

      sinon.stub(db.user, "updateUserMetaByEmail", function(email, meta, callback) {
        "db.user.updateUserMetaByEmail should not be triggered".should.be.eql("db.user.updateUserMetaByEmail was triggered");
        done();
      });

      reportService.report(goodUser, 321, function(err, response) {
        done();
      });
    });
  });
});

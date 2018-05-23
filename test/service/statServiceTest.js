const should = require("should");
const sinon = require("sinon");
const statService = require("../../src/service/statService");
const db = require("@rando4.me/db");
const mockUtil = require("../mockUtil");
const Errors = require("../../src/error/errors");

describe("Statservice", () => {
  describe("getUserStats", () => {
    afterEach(() => {
      mockUtil.clean(db);
    });

    it("should return User Stats successfully", (done) => {
      sinon.stub(db.user, "getUserStatistics", (email, callback) => {
        if (email == "user@mail.com") {
          callback(null, {"likes" : 5, "dislikes" : 1});
      }
      });

      statService.getUserStats("user@mail.com", (err, statistics) => {
        should.not.exist(err);
        should.exist(statistics);
        statistics.should.have.properties({"likes" : 5, "dislikes" : 1});
        done();
      });
    });

    it("should return system error when db returns error state", (done) => {
      sinon.stub(db.user, "getUserStatistics", (email, callback) => {
        if (email == "user@mail.com") {
          callback("error");
      }
      });

      statService.getUserStats("user@mail.com", (err, statistics) => {
        should.exist(err);
        should.not.exist(statistics);
        err.should.be.eql(Errors.System("error"));
        done();
      });
    });

  });
});

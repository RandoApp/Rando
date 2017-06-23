var should = require("should");
var noSpamFilter = require("../../src/filter/noSpamFilter");
var sinon = require("sinon");
var db = require("randoDB");
var mockUtil = require("../mockUtil");

describe("noSpamFilter.", () => {
  describe("run.", () => {
    afterEach(() => {
      mockUtil.clean(db, Date);
    });

    it("Should sendForbidden", (done) => {
      var req = {lightUser: {email: "user@rando4.me" }};
      var now = 15*1000;
      var user = {
        out: [{
            randoId: "1",
            creation: now - 1*1000
          }, {
            randoId: "2",
            creation: now - 2*1000
          }, {
            randoId: "3",
            creation: now - 3*1000
          }, {
            randoId: "4",
            creation: now - 4*1000
          }, {
            randoId: "5",
            creation: now - 5*1000
          }, {
            randoId: "6",
            creation: now - 6*1000
          }, {
            randoId: "7",
            creation: now - 7*1000
          }, {
            randoId: "8",
            creation: now - 8*1000
          }, {
            randoId: "9",
            creation: now - 9*1000
          }, {
            randoId: "10",
            creation: now - 10*1000
          }
        ]
      };

      sinon.stub(Date, "now", () => {
        return now;
      });

      sinon.stub(db.user, "getAllLightOutRandosByEmail", (email, limit, callback) => {
        callback(null, user);
      });

      sinon.stub(db.user, "updateUserMetaByEmail", (email, ban, callback) => {
        callback();
      });

      noSpamFilter.run(req, {
        status (status) {
          status.should.eql(403);
          return this;
        },
        send (res) {
          res.message.should.eql("Forbidden. Reset: 10815000");
          done();
        }
      }, () => {
        "Next should not be triggered".should.be.eql("Next was triggered");
        done();
      });
    });
  });
});

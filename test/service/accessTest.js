var should = require("should");
var sinon = require("sinon");
var access = require("../../src/service/access");
var config = require("config");
var Errors = require("../../src/error/errors");
var db = require("randoDB");

describe("Access service.", function () {
  describe("No Spam.", function () {
    it("Banned user get Forbidden error", function (done) {
      var resetTime = Date.now() + config.app.limit.ban;
      var user = {
        email: "user@mail.com",
        ban: resetTime,
        ip: "127.0.0.1"
      };

      access.noSpam({user: user}, {
        status: function (status) {
          status.should.be.eql(403);
          return this;
        },
        send: function (response) {
          response.should.be.eql({
            status: 403,
            code: 411,
            message: "Forbidden. Reset: " + resetTime,
            description: "See https://github.com/RandoApp/Rando/wiki/Errors"
          });
          done();
        }
      }, null);
    });

    it("Banned user with old reset time does not get Forbidden error", function (done) {
      var resetTime = Date.now() - 100;
      var user = {
        email: "user@mail.com",
        ban: resetTime,
        ip: "127.0.0.1",
        out: [],
        in: []
      };

      access.noSpam({user: user}, {send: function () {
        should.fail("Should not reponse.send be called");
      }}, function () {
        done();
      });
    });

    it("User with not enough randos retun without errors", function (done) {
      var resetTime = Date.now() - 100;
      var user = {
        email: "user@mail.com",
        ban: resetTime,
        ip: "127.0.0.1",
        out: [{randoId: 1, creation: 100}, {randoId: 2, creation: 1000000}],
        in: []
      };

      access.noSpam({user: user}, {send: function () {
        should.fail("Should not reponse.send be called");
      }}, function () {
        done();
      });
    });

    it("User with a lot of legal randos return without errors", function (done) {
      var out = [];
      for (var i = 0; i < config.app.limit.images + 10; i++) {
        var creation = Date.now() - i * 100000000;
        out.push({
          randoId: i,
          creation: creation
        });
      }

      var user = {
        email: "user@mail.com",
        authToken: "token",
        ban: "",
        ip: "127.0.0.1",
        out: out,
        in: []
      };

      access.noSpam({user: user}, {send: function () {
        should.fail("Should not reponse.send be called");
      }}, function () {
        done();
      });
    });

    it("User with spam should get Forbidden error", function (done) {
      var out = [];
      for (var i = 0; i < config.app.limit.images + 10; i++) {
        var creation = Date.now() + i;
        out.push({
          randoId: i,
          creation: creation
        });
      }

      var user = {
        email: "user@mail.com",
        ban: "",
        ip: "127.0.0.1",
        out: out,
        in: []
      };

      sinon.stub(db.user, "update", function (user, callback) {
        db.user.update.restore();
        callback();
      });

      access.noSpam({user: user}, {
        status: function (status) {
          status.should.be.eql(403);
          return this;
        },
        send: function (response) {
          response.should.be.eql({
            status: 403,
            code: 411,
            message: "Forbidden. Reset: " + user.ban,
            description: "See https://github.com/RandoApp/Rando/wiki/Errors"
          });
          done();
        }
      }, function () {
        should.fail("Should not next be called");
      });
    });
});

describe("For user with token.", function () {
  it("Empty token should return Unauthorized error", function (done) {
    access.byToken({ip: "127.0.0.1", query: {}}, {
      status: function(status) {
        status.should.be.eql(401);
        return this;
      },
      send: function (response) {
        response.should.be.eql(Errors.Unauthorized().rando);
        done();
      }
    }, function () {
      should.fail("Should not next be called");
    });
  });

  it("Not found user with token should return Unauthorized error", function (done) {
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback();
    });

    access.byToken({query: {token: "12345"}, ip: "127.0.0.1"}, {
      status: function(status) {
        status.should.be.eql(401);
        return this;
      },
      send: function (response) {
        response.should.be.eql(Errors.Unauthorized().rando);
        done()
      }
    }, function () {
      should.fail("Should not next be called");
    });
  });

  it("DB error should return System error", function (done) {
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback(new Error("DB error"));
    });

    access.byToken({query: {token: "12345"}, ip: "127.0.0.1"}, {
      status: function(status) {
        status.should.be.eql(500);
        return this;
      },
      send: function (response) {
        response.should.be.eql(Errors.System(new Error()).rando);
        done();
      }
    }, function () {
      should.fail("Should not next be called");
    });
  });

  it("Exist user should be returend without error", function (done) {
    var user = {email: "user@mail.com"};
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback(null, user);
    });

    sinon.stub(db.user, "update", function (user, callback) {
      db.user.update.restore();
    });

    var req = {query: {token: "12345"}, ip: "127.0.0.1"};

    access.byToken(req, {
      send: function (response) {
        should.fail("Should not send be called");
      }
    }, function () {
      req.user.should.be.eql(user);
      done();
    });
  });
});

describe("Update ip.", function () {
  it("User with same ip should not be updated", function (done) {
    var user = {email: "user@mail.com", ip: "127.0.0.1"};
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback(null, user);
    });

    sinon.stub(db.user, "update", function (user, callback) {
      should.fail("Should not db.user.update be called");
    });

    access.byToken({query: {token: "123"}, ip: "127.0.0.1"}, {}, function () {
      db.user.update.restore();
      done();
    });
  });

  it("User with old ip should be updated with new ip", function (done) {
    var user = {email: "user@mail.com", ip: "127.1.1.1"};
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback(null, user);
    });

    sinon.stub(db.user, "update", function (user, callback) {
      db.user.update.restore();
      user.ip.should.be.eql("127.0.0.1");
      done();
    });

    access.byToken({query: {token: "123"}, ip: "127.0.0.1"}, {}, function () {
                //do nothing
              });
  });

  it("User without any ip should be updated with new ip", function (done) {
    var user = {email: "user@mail.com"};
    sinon.stub(db.user, "getByToken", function (token, callback) {
      db.user.getByToken.restore();
      callback(null, user);
    });

    sinon.stub(db.user, "update", function (user, callback) {
      db.user.update.restore();
      user.ip.should.be.eql("127.0.0.1");
      done();
    });

    access.byToken({query: {token: "123"}, ip: "127.0.0.1"}, {}, function () {
                //do nothing
              });
  });
});
});

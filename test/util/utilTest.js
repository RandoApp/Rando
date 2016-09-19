var should = require("should");
var sinon = require("sinon");
var util = require("../../src/util/util");
var crypto = require("crypto");

describe("Util.", function () {
  describe("generateUniqueName.", function () {
    it("Error from crypto should bubble up", function (done) {
      var error = "Error in crypto";
      sinon.stub(crypto, "pseudoRandomBytes", function (length, callback) {
        callback(new Error(error));
        crypto.pseudoRandomBytes.restore();
      });

      util.generateUniqueName(function (err) {
        should.exist(err);
        err.should.have.property("message", error);
        done();
      });
    });

    it("Successful unique name", function (done) {
      util.generateUniqueName(function (err, name) {
        should.not.exist(err);
        name.should.match(/^[\w\d]+$/);
        done();
      });
    });
  });

  describe("generateImageName.", function () {
    it("Error bubble up", function (done) {
      var error = "Error when generate unique name";
      sinon.stub(util, "generateUniqueName", function (callback) {
        callback(new Error(error));
        util.generateUniqueName.restore();
      });

      util.generateImageName(function (err, randoId, imageURLs) {
        should.exist(err);
        err.should.have.property("message", error);
        done();
      });
    });

    it("Full path is correct", function (done) {
      util.generateImageName(function (err, randoId, imageURLs) {
        should.not.exist(err);
        should.exist(randoId);
        imageURLs.origin.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
        imageURLs.small.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
        imageURLs.medium.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
        imageURLs.large.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
        done();
      });
    });
  });

  describe("getSizeableOrEmpty.", function () {
    it("Should return good object when arg is ok", function (done) {
      var actual = util.getSizeableOrEmpty({small: "small", medium: "medium", large: "large"});
      actual.should.be.eql({small: "small", medium: "medium", large: "large"});
      done();
    });

    it("Should return empty object when arg is null", function (done) {
      var actual = util.getSizeableOrEmpty();
      actual.should.be.eql({small: "", medium: "", large: ""});
      done();
    });

    it("Should return empty object when some sizable properties are empty", function (done) {
      var actual = util.getSizeableOrEmpty({small: "small", medium: "medium"});
      actual.should.be.eql({small: "small", medium: "medium", large: ""});

      actual = util.getSizeableOrEmpty({small: "small", large: "large"});
      actual.should.be.eql({small: "small", medium: "", large: "large"});

      actual = util.getSizeableOrEmpty({medium: "medium", large: "large"});
      actual.should.be.eql({small: "", medium: "medium", large: "large"});
      done();
    });
  });

});

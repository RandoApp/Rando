var should = require("should");
var sinon = require("sinon");
var imageService = require("../../src/service/imageService");
var gm = require("gm").subClass({ imageMagick: true });

describe("Image service.", function () {
  describe("Resize.", function () {

    it("Resize should be done without error, if error not occured", function (done) {
      var isGmWriteCalled = false;

      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        isGmWriteCalled = true;
        callback(null);
      });

      var randoId = "123iojf";
      var imagePaths = {
        small: "image/small/" + randoId + ".jpg",
        medium: "image/medium/" + randoId + ".jpg",
        large: "image/large/" + randoId + ".jpg"
      };
      var imagePath = "image/large/" + randoId;

      imageService.resize("small", imagePaths, randoId, imagePath, function (err) {
        should.not.exist(err);
        isGmWriteCalled.should.be.true;

        gm.prototype.write.restore();

        done();
      });
    });

    it("Resize should be done with error, if gm done with error", function (done) {
      var errorMessage = "Some system error";
      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        var error = new Error(errorMessage); 
        callback(error);
      });

      var randoId = "123iojf";
      var imagePaths = {
        small: "image/small/" + randoId + ".jpg",
        medium: "image/medium/" + randoId + ".jpg",
        large: "image/large/" + randoId + ".jpg"
      };
      var imagePath = "image/origin/" + randoId;

      imageService.resize("small", imagePaths, randoId, imagePath, function (err) {
        should.exist(err);
        err.should.have.property("message", errorMessage);

        gm.prototype.write.restore();
        done();
      });
    });

    it("gm should call with correct args", function (done) {
      sinon.stub(gm.prototype.__proto__, "resize", function (size) {
        should.exists(size);
        size.should.be.type("number");
        return this;
      });

      sinon.stub(gm.prototype.__proto__, "quality", function (val) {
        should.exists(val);
        val.should.be.type("number");
        val.should.be.within(0, 100);
        return this;
      });

      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        callback(null);
      });

      var randoId = "123iojf";
      var imagePaths = {
        small: "image/small/123i/" + randoId + ".jpg",
        medium: "image/medium/123i/" + randoId + ".jpg",
        large: "image/large/123i/" + randoId + ".jpg"
      };
      var imagePath = "image/123i/" + randoId;

      imageService.resize("small", imagePaths, randoId, imagePath, function (err) {
        gm.prototype.resize.restore();
        gm.prototype.quality.restore();
        gm.prototype.write.restore();
        done();
      });
    });
});
});


var should = require("should");
var sinon = require("sinon");
var randoService = require("../../src/service/randoService");
var mapService = require("../../src/service/mapService");
var s3Service = require("../../src/service/s3Service");
var util = require("../../src/util/util");
var fs = require("fs");
var gm = require("gm").subClass({ imageMagick: true });
var db = require("randoDB");
var Errors = require("../../src/error/errors");
var mockUtil = require("../mockUtil");

describe("Rando service.", function () {
  describe("Save image.", function () {

    afterEach(function() {
      mockUtil.clean(db);
      mockUtil.clean(fs);
      mockUtil.clean(s3Service);
      mockUtil.clean(gm.prototype.__proto__);

      if (util.generateImageName.restore) {
        util.generateImageName.restore();
      }
    });

    it("Should return incorrect args error when rando path is undefined", function (done) {
      randoService.saveImage({email: "user@mail.com"}, null, {latitude: "32", longitude: "23"}, function (err) {
        err.should.eql(Errors.IncorrectArgs());
        done();
      });
    });

    it("Should return system error whem image path is not exist", function (done) {
      randoService.saveImage({email: "user@mail.com"}, "/tmp/not-exists-image.jpg", {latitude: "32", longitude: "23"}, function (err) {
        err.rando.should.be.eql(Errors.System(new Error("errno 34")).rando);
        done();
      });
    });

    it("Should return system error when Generate Image Name return error", function (done) {
      var called = false;
      sinon.stub(util, "generateImageName", function (callback) {
        called = true;
        callback(Errors.System(new Error()));
      });

      randoService.saveImage({user: "user@mail.com"}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
        called.should.be.true;
        err.rando.should.be.eql(Errors.System(new Error()).rando);
        done();
      });
    });

    it("Should return system error, when db error", function (done) {
      mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

      sinon.stub(db.rando, "add", function (rando, callback) {
        callback(new Error("Some db error"));
      });

      sinon.stub(db.user, "update", function (user) {
                //do nothing
              });

      sinon.stub(fs, "rename", function (source, dest, callback) {
        callback(null);
      });
      sinon.stub(fs, "unlink", function (file, callback) {
        callback(null);
      });
      sinon.stub(s3Service, "upload", function (file, size, callback) {
        callback(null, "http://rando4me/image/someimage.jpg");
      });
      
      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        callback();
      });

      randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
        err.rando.should.be.eql(Errors.System(new Error()).rando);

        done();
      });
    });

    it("Should return system error when upload image with error to S3", function (done) {
      mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

      sinon.stub(fs, "rename", function (source, dest, callback) {
        callback(null);
      });
      sinon.stub(s3Service, "upload", function (file, size, callback) {
        callback(Errors.System(new Error("S3 error")));
      });
      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        callback();
      });

      randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
        err.rando.should.be.eql(Errors.System(new Error()).rando);

        done();
      });
    });

    it("Should successful save image", function (done) {
      mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];
      var renameCalled = false;
      sinon.stub(db.rando, "add", function (rando, callback) {
        callback();
      });

      sinon.stub(db.user, "addRandoToUserOutByEmail", function (email, rando, callback) {
        callback();
      });

      sinon.stub(fs, "rename", function (source, dest, callback) {
        renameCalled = true;
        callback(null);
      });
      sinon.stub(s3Service, "upload", function (file, size, callback) {
        callback(null, "http://rando4me/image/someimage.jpg");
      });
      sinon.stub(fs, "unlink", function (file, callback) {
        callback(null);
      });
      sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
        callback();
      });

      randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err, imageURL) {
        renameCalled.should.be.true;
        should.not.exist(err);
        should.exist(imageURL);

        done();
      });
    });
  });
});

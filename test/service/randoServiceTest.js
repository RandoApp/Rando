var should = require("should");
var sinon = require("sinon");
var randoService = require("../../src/service/randoService");
var mapService = require("../../src/service/mapService");
var s3Service = require("../../src/service/s3Service");
var util = require("../../src/util/util");
var fs = require("fs");
var mongooseMock = require("../util/mongooseMock");
var gm = require("gm").subClass({ imageMagick: true });

describe('Rando service.', function () {
    describe('Save image.', function () {

	beforeEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Undefined rando path', function (done) {
	    randoService.saveImage(mongooseMock.user(), null, {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Image path is not exist', function (done) {
	    randoService.saveImage(mongooseMock.user(), "/tmp/not-exists-image.jpg", {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("errno", 34);
		done();
	    });
	});

	it('Generate Image Name with error throw error', function (done) {
	    var error = "Some streng error";
	    var called = false;
	    sinon.stub(util, "generateImageName", function (callback) {
		called = true;
		util.generateImageName.restore();
		callback(new Error(error));
	    });

	    randoService.saveImage(mongooseMock.user(), "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		called.should.be.true;
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Error when add image', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

	    var error = "Data base error";
	    mongooseMock.stubSave(function (callback) {
		callback(new Error(error));
	    });
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		fs.rename.restore();
		callback(null);
	    });
            sinon.stub(s3Service, "upload", function (file, size, callback) {
                callback(null, "http://rando4me/image/someimage.jpg");
            });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    randoService.saveImage(mongooseMock.user(), "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", error);

		gm.prototype.write.restore();
		mongooseMock.restore();
                s3Service.upload.restore();
		done();
	    });
	});

	it('Error when upload image to S3', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

	    var error = "S3 error";
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		fs.rename.restore();
		callback(null);
	    });
            sinon.stub(s3Service, "upload", function (file, size, callback) {
                callback(new Error(error));
            });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    randoService.saveImage(mongooseMock.user(), "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", error);

		gm.prototype.write.restore();
                s3Service.upload.restore();
		done();
	    });
	});

	it('Successful save image', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];
	    mongooseMock.stubSave().stubFindById();
	    var renameCalled = false;
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		renameCalled = true;
		fs.rename.restore();
		callback(null);
	    });
            sinon.stub(s3Service, "upload", function (file, size, callback) {
                callback(null, "http://rando4me/image/someimage.jpg");
            });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    randoService.saveImage(mongooseMock.user(), "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err, imageURL) {
		renameCalled.should.be.true;
		should.not.exist(err);
		should.exist(imageURL);


		gm.prototype.write.restore();
                s3Service.upload.restore();
		mongooseMock.restore();
		done();
	    });
	});
    });
});

var should = require("should");
var sinon = require("sinon");
var foodService = require("../../src/service/foodService");
var mapService = require("../../src/service/mapService");
var util = require("../../src/util/util");
var fs = require("fs");
var mongooseMock = require("../util/mongooseMock");
var gm = require("gm").subClass({ imageMagick: true });

describe('Food service.', function () {
    describe('Save food.', function () {

	beforeEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Undefined food path', function (done) {
	    foodService.saveFood(mongooseMock.user(), null, {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Food path is not exist', function (done) {
	    foodService.saveFood(mongooseMock.user(), "/tmp/not-exists-food.jpg", {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("errno", 34);
		done();
	    });
	});

	it('Generate Food Name with error throw error', function (done) {
	    var error = "Some streng error";
	    var called = false;
	    sinon.stub(util, "generateFoodName", function (callback) {
		called = true;
		util.generateFoodName.restore();
		callback(new Error(error));
	    });

	    foodService.saveFood(mongooseMock.user(), "/tmp/some-food.png", {latitude: "32", longitude: "23"}, function (err) {
		called.should.be.true;
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Error when add food', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

	    var error = "Data base error";
	    mongooseMock.stubSave(function (callback) {
		callback(new Error(error));
	    });
	    sinon.stub(fs, "mkdir", function (p, mode, callback) {
		fs.mkdir.restore();
		callback(null);
	    });
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		fs.rename.restore();
		callback(null);
	    });

	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    foodService.saveFood(mongooseMock.user(), "/tmp/some-food.png", {latitude: "32", longitude: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", error);

		gm.prototype.write.restore();
		mongooseMock.restore();
		done();
	    });
	});

	it('Successful save food', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];
	    mongooseMock.stubSave().stubFindById();
	    var mkDirCalled = false;
	    var renameCalled = false;
	    sinon.stub(fs, "mkdir", function (p, mode, callback) {
		mkDirCalled = true;
		fs.mkdir.restore();
		callback(null);
	    });
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		renameCalled = true;
		fs.rename.restore();
		callback(null);
	    });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    foodService.saveFood(mongooseMock.user(), "/tmp/some-food.png", {latitude: "32", longitude: "23"}, function (err, foodUrl) {
		mkDirCalled.should.be.true;
		renameCalled.should.be.true;
		should.not.exist(err);
		should.exist(foodUrl);


		gm.prototype.write.restore();
		mongooseMock.restore();
		done();
	    });
	});
    });
});

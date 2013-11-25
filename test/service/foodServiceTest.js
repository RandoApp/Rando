var should = require("should");
var sinon = require("sinon");
var foodService = require("../../src/service/foodService");
var util = require("../../src/util/util");
var fs = require("fs");
var mongooseMock = require("../util/mongooseMock");

describe('Food service.', function () {
    describe('Save food.', function () {
	it('Undefined userId', function (done) {
	    foodService.saveFood(null, null, null, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Undefined food path', function (done) {
	    foodService.saveFood("userid", null, {lat: "32", long: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Food path is not exist', function (done) {
	    foodService.saveFood("userid", "tmp/not-exists-food.jpg", {lat: "32", long: "23"}, function (err) {
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

	    foodService.saveFood("userid", "/tmp/some-food.png", {lat: "32", long: "23"}, function (err) {
		called.should.be.true;
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Error when add food', function (done) {
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

	    foodService.saveFood("524ebb7dcb9da8ab5b000002", "/tmp/some-food.png", {lat: "32", long: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", error);

		mongooseMock.restore();
		done();
	    });
	});

	it('Error when update user', function (done) {
	    var error = "Data base error";
	    mongooseMock.stubFindById(function(id, callback) {
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

	    foodService.saveFood("524ebb7dcb9da8ab5b000002", "/tmp/some-food.png", {lat: "32", long: "23"}, function (err) {
		should.exist(err);
		err.should.have.property("message", error);

		mongooseMock.restore();
		done();
	    });
	});

	it('Successful save food', function (done) {
	    mongooseMock.stubSave().stubFindById();
	    mkDirCalled = false;
	    renameCalled = false;
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

	    foodService.saveFood("524ebb7dcb9da8ab5b000002", "/tmp/some-food.png", {lat: "32", long: "23"}, function (err, foodUrl) {
		mkDirCalled.should.be.true;
		renameCalled.should.be.true;
		should.not.exist(err);
		should.exist(foodUrl);

		mongooseMock.restore();
		done();
	    });
	});
    });
});

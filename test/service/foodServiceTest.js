var should = require("should");
var sinon = require("sinon");
var foodService = require("../../src/service/foodService");
var util = require("../../src/util/util");
var fs = require("fs");

describe('Food service.', function () {
    describe('Save food.', function () {
	it('Undefined food path', function (done) {
	    foodService.saveFood(null, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorect food path");
		done();
	    });
	});

	it('Food path is not exist', function (done) {
	    foodService.saveFood("tmp/not-exists-food.jpg", function (err) {
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

	    foodService.saveFood("/tmp/some-food.png", function (err) {
		called.should.be.true;
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Successful save food', function (done) {
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

	    foodService.saveFood("/tmp/some-food.png", function (err) {
		mkDirCalled.should.be.true;
		renameCalled.should.be.true;
		should.not.exist(err);
		done();
	    });
	});
    });
});

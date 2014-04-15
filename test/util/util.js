var should = require("should");
var sinon = require("sinon");
var util = require("../../src/util/util");
var crypto = require("crypto");

describe('Util.', function () {
    describe('generateUniqueName.', function () {
	it('Error from crypto should bubble up', function (done) {
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

	it('Successful unique name', function (done) {
	    util.generateUniqueName(function (err, name) {
		should.not.exist(err);
		name.should.match(/^[\w\d]+$/);
		done();
	    });
	});
    });

    describe('generateFoodName.', function () {
	it('Error bubble up', function (done) {
	    var error = "Error when generate unique name";
	    sinon.stub(util, "generateUniqueName", function (callback) {
		callback(new Error(error));
		util.generateUniqueName.restore();
	    });

	    util.generateFoodName(function (err, foodId, foodUrls) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Full path is correct', function (done) {
	    util.generateFoodName(function (err, foodId, foodUrls) {
		should.not.exist(err);
		should.exist(foodId);
		foodUrls.origin.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.png$/);
		foodUrls.small.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
		foodUrls.medium.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
		foodUrls.large.should.match(/^[\w\d\/]*[\w\d]+\/[\w\d]+\.jpg$/);
		done();
	    });
	});
    });
});

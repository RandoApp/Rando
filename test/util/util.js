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

    describe('generateImageName.', function () {
	it('Error bubble up', function (done) {
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

	it('Full path is correct', function (done) {
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
});

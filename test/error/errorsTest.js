var should = require("should");
var sinon = require("sinon");
var Errors = require("../../src/error/errors");

describe('Errors.', function () {
    describe('To Response.', function () {
	it('Unknow errors should return 500 error', function (done) {
	    var expected = {
		status: 500,
		code: 500,
		message: "Internal Server Error",
		description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
	    }

	    var actual = Errors.toResponse(new Error("Some unknown error"));

	    actual.should.be.eql(expected);
	    done();
	});
	it('Error with foodex meta data should return only meta data', function (done) {
	    var expected = {
		status: 500,
		code: 501,
		message: "Internal Server Error",
		description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
	    }

	    var actual = Errors.toResponse(Errors.System(new Error("Some system error")));

	    actual.should.be.eql(expected);
	    done();
	});
    });
});

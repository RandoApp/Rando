var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var mongooseMock = require("../util/mongooseMock");

describe('Comment service.', function () {
    describe('report.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Invalid email should return Error', function () {
	    comment.report("id", function (err) {
		should.exist(err);
		err.should.have.property("message", "Invalid email");
	    });
	});
    });
});

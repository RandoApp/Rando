var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var mongooseMock = require("../util/mongooseMock");

describe('Comment service.', function () {
    describe('Report.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Successful report', function (done) {
	    var saveCalled = false;
	    mongooseMock.stubFindOne().stubSave(function (callback) {
		saveCalled = true;
		callback(null);
	    });

	    commentService.report("user@mail.com", "3333", function (err) {
		should.not.exist(err);
		saveCalled.should.be.true;
		done();
	    });
	});

	it('Can not find user by email', function (done) {
	    var error = "Data base connection error";
	    mongooseMock.stubFindOne(function (email, callback) {
		callback(new Error(error));
	    });

	    commentService.report("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('User not found', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser();

	    commentService.report("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", "User not found");
		done();
	    });
	});

	it('Food not found', function (done) {
	    mongooseMock.stubFindOneWithEmptyUser();

	    commentService.report("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", "Food not found");
		done();
	    });
	});
    });

    describe('Bon appetit.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Successful bon appetit', function (done) {
	    var saveCalled = false;
	    mongooseMock.stubFindOne().stubSave(function (callback) {
		saveCalled = true;
		callback(null);
	    });

	    commentService.bonAppetit("user@mail.com", "3333", function (err) {
		should.not.exist(err);
		saveCalled.should.be.true;
		done();
	    });
	});

	it('Can not find user by email', function (done) {
	    var error = "Data base connection error";
	    mongooseMock.stubFindOne(function (email, callback) {
		callback(new Error(error));
	    });

	    commentService.bonAppetit("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('User not found', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser();

	    commentService.bonAppetit("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", "User not found");
		done();
	    });
	});

	it('Food not found', function (done) {
	    mongooseMock.stubFindOneWithEmptyUser();

	    commentService.bonAppetit("user@mail.com", "3333", function (err) {
		should.exist(err);
		err.should.have.property("message", "Food not found");
		done();
	    });
	});
    });
});

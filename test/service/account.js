var should = require("should");
var sinon = require("sinon");
var account = require("../../src/service/account");

describe('Account service', function () {
    describe('Register by email', function () {
	it('Invalid email should return Error', function () {
	    account.registerByEmailAndPassword("this is not email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Invalid email");
	    });
	});

	it('Empty email should return Error', function () {
	    account.registerByEmailAndPassword("", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "Invalid email");
	    });
	});

	it('Empty password should return Error', function () {
	    account.registerByEmailAndPassword("this@is.email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Empty password");
	    });
	});

	it('Correct email and password should not return Error', function () {
	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
	    });
	});

    });
});

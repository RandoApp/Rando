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
	    var email = "email@mail.com";

	    var mongoose = require("mongoose");
	    sinon.stub(mongoose.Model.prototype, "save", function (callback) {callback();});
	    sinon.stub(mongoose.Model, "findOne", function (email, callback) {
		callback();
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
	    });
	});

	it('User already exist', function () {
	    var email = "email@mail.com";

	    mongoose = require("mongoose");
	    mongoose.Model.findOne.restore();
	    sinon.stub(mongoose.Model, "findOne", function (email, callback) {
		callback(null, {user: "some user"});
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "User already exists");
	    });

	});

    });
});

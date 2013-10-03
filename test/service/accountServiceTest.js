var should = require("should");
var sinon = require("sinon");
var account = require("../../src/service/accountService");
var mongooseMock = require("../util/mongooseMock");

describe('Account service.', function () {
    describe('Register by email.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

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

	it('Correct email and password should not return Error', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
		done();
	    });
	});

	it('User already exist', function (done) {
	    mongooseMock.stubSave().stubFindOne(function (email, callback) {
		try {
		    email.should.have.property("email", "email@mail.com");
		} catch (e) {
		    done(e);
		    return;
		}
		callback(null, {user: "some user"});
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "User already exists");
		done();
	    });
	});

	it('Can not find user by email', function (done) {
	    mongooseMock.stubSave().stubFindOne(function (email, callback) {
		callback(new Error("Any problem with data base connection"));
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "Can't find user by email");
		done();
	    });
	    
	});

	it('User created successful', function (done) {
	    var saveCalled = false;
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave(function (callback) {
		saveCalled = true;
		callback(null);
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
		saveCalled.should.be.true;
		done();
	    });
	});

	it('Can not create user', function (done) {
	    var saveCalled = false;
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave(function (callback) {
		saveCalled = true;
		callback(new Error("Some strange error with database"));
	    });

	    account.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		saveCalled.should.be.true;
		should.exist(err);
		err.should.have.property("message", "Can't create user");
		done();
	    });
	});

    });
});

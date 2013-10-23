var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var mongooseMock = require("../util/mongooseMock");

describe('User service.', function () {
    describe('Register by email.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Invalid email should return Error', function () {
	    userService.registerByEmailAndPassword("this is not email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Invalid email");
	    });
	});

	it('Empty email should return Error', function () {
	    userService.registerByEmailAndPassword("", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "Invalid email");
	    });
	});

	it('Empty password should return Error', function () {
	    userService.registerByEmailAndPassword("this@is.email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Empty password");
	    });
	});

	it('Correct email and password should not return Error', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    userService.registerByEmailAndPassword("email@mail.com", "password", function (err) {
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

	    userService.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "User already exists");
		done();
	    });
	});

	it('Can not find user by email', function (done) {
	    var error = "Any problem with data base connection";
	    mongooseMock.stubSave().stubFindOne(function (email, callback) {
		callback(new Error(error));
	    });

	    userService.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('User created successful', function (done) {
	    var saveCalled = false;
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave(function (callback) {
		saveCalled = true;
		callback(null);
	    });

	    userService.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
		saveCalled.should.be.true;
		done();
	    });
	});

	it('Can not create user', function (done) {
	    var error = "Some strange error with database";
	    var saveCalled = false;
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave(function (callback) {
		saveCalled = true;
		callback(new Error(error));
	    });

	    userService.registerByEmailAndPassword("email@mail.com", "password", function (err) {
		saveCalled.should.be.true;
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});
    });

    describe('Find User By id.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Cant find user by id', function (done) {
	    var error = "Error in mongodb";
	    mongooseMock.stubFindById(function (id, callback) {
		callback(new Error(error));
	    });

	    userService.findUserById("123123123", function (err, user) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('User not exist', function (done) {
	    mongooseMock.stubFindByIdWithNotFoundUser();

	    userService.findUserById("123123124", function (err, user) {
		should.exist(err);
		err.should.have.property("message", "User not found");
		done();
	    });
	});

	it('User exist', function (done) {
	    mongooseMock.stubFindById();

	    userService.findUserById("123123125", function (err, user) {
		should.not.exist(err);
		should.exist(user);
		user.should.have.property("email", "user@mail.com");
		done();
	    });
	});
    });

    describe('Find or create by FB data.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Wrong data without email from facebook', function (done) {
	    userService.findOrCreateByFBData({email: null}, function (err) {
		should.exist(err);
		err.should.have.property("message", "No email");
		done();
	    });

	});
	it('No data from facebook', function (done) {
	    userService.findOrCreateByFBData(null, function (err) {
		should.exist(err);
		err.should.have.property("message", "No email");
		done();
	    });
	});
	it('Database error', function (done) {
	    mongooseMock.stubFindOne(function (email, callback) {
		callback(new Error("Data base error"));
	    });

	    userService.findOrCreateByFBData({email: "user@mail.com"}, function (err) {
		should.exist(err);
		err.should.have.property("message", "Data base error");
		done();
	    });
	});
	it('User exist', function (done) {
	    mongooseMock.stubFindOne();

	    userService.findOrCreateByFBData({email: "user@mail.com"}, function (err, userId) {
		should.not.exist(err);
		should.exist(userId);
		done();
	    });
	});
	it('Create user', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    userService.findOrCreateByFBData({email: "user@mail.com", id: "23131231"}, function (err, userId) {
		should.not.exist(err);
		should.exist(userId);
		done();
	    });
	});
    });

});

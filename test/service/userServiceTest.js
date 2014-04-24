var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var mongooseMock = require("../util/mongooseMock");

describe('User service.', function () {
    describe('Find or create user by login and password.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Invalid email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this is not email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Empty email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Empty password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Undefined email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword(null, "", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Undefined password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", null, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Correct email and password should not return Error', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", function (err) {
		should.not.exist(err);
		done();
	    });
	});

	it('Data base error should return error', function (done) {
	    var error = "Data base error";

	    mongooseMock.stubFindOne(function (email, callback) {
		callback(new Error(error));

	    });

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", function (err) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Differents passwords should return error', function (done) {
	    mongooseMock.stubSave().stubFindOne(function (email, callback) {
		try {
		    email.should.have.property("email", "email@mail.com");
		} catch (e) {
		    done(e);
		    return;
		}
		callback(null, {user: "some user"});
	    });

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password2", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Same passwords should return user', function (done) {
	    mongooseMock.stubFindOne(function (email, callback) {
		callback(null, {
		    id: "123456789",
		    email: "user@mail.com",
		    password: "7548a5ca114de42a25cc6d93e2ab74095b290ec5", //echo -n "passwordForSha1user@mail.comSecret" | sha1sum
		    authToken: "",
		    save: function (callback) {
			if (callback) {
			    callback(null);
			}
		    }
		});
	    });

	    userService.findOrCreateByLoginAndPassword("user@mail.com", "passwordForSha1", function (err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });
	});

	it('New user should be created in data base and return token', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave();

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", function (err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });
	});
    });

    describe('Generate Hash for password.', function () {
	it('Sha1 algorithm should work', function (done) {
	    var expected = "7548a5ca114de42a25cc6d93e2ab74095b290ec5"; //echo -n "passwordForSha1user@mail.comSecret" | sha1sum
	    var actual = userService.generateHashForPassword("user@mail.com", "passwordForSha1");
	    actual.should.be.equal(expected);
	    done();
	});
    });

    describe('Is password correct.', function () {
	it('Same passwords return true', function (done) {
	    var user = {
		email: "user@mail.com",
		password: "7548a5ca114de42a25cc6d93e2ab74095b290ec5" //echo -n "passwordForSha1user@mail.comSecret" | sha1sum
	    };
	    var actual = userService.isPasswordCorrect("passwordForSha1", user);
	    actual.should.be.true;
	    done();
	});

	it('Differents passwords return false', function (done) {
	    var user = {
		email: "user@mail.com",
		password: "7548a5ca114de42a25cc6d93e2ab74095b290ec5" //echo -n "passwordForSha1user@mail.comSecret" | sha1sum
	    };
	    var actual = userService.isPasswordCorrect("differentPassword", user);
	    actual.should.be.false;
	    done();
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
		err.should.have.property("message", "Incorrect args");
		done();
	    });

	});
	it('No data from facebook', function (done) {
	    userService.findOrCreateByFBData(null, function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
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
    describe('Get user.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Get user successfully', function (done) {
	    userService.getUser(mongooseMock.user(), function (err, user) {
		should.not.exist(err);
		should.exist(user);
		//TODO: make assertion more strongly;
		user.should.have.property("email", "user@mail.com");
		user.randos.should.not.be.empty;
		done();
	    });
	});
    });
    describe('Find Or Create Anonymouse.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Not defined id should return error', function (done) {
	    userService.findOrCreateAnonymous(null, function (err, response) {
		should.exist(err);
		err.should.have.property("message", "Id is not correct");
		done();
	    });
	});

	it('Error in database should return system error', function (done) {
	    var error = "Database error";
	    mongooseMock.stubFindOne(function(err, callback) {
		callback(new Error(error));
	    });

	    userService.findOrCreateAnonymous("efab3c3", function(err, response) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Anonymous user already exists', function (done) {
	    mongooseMock.stubFindOne();

	    userService.findOrCreateAnonymous("efab3c3", function(err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });
	});
	
	it('Anonymous should be created in database if not found', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave(function (callback) {
		this._id = "524ea2324a590391a3e8b516";

		this.should.have.property("email", "efab3c3@rando4.me");
		this.should.have.property("anonymousId", "efab3c3");
		callback(null, this);
	    });

	    userService.findOrCreateAnonymous("efab3c3", function(err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });

	});
    });

});

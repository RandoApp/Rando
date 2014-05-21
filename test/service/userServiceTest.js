var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var mongooseMock = require("../util/mongooseMock");
var config = require("config");


describe('User service.', function () {
    describe('Find or create user by login and password.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Invalid email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this is not email", "", "127.0.0.1", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Empty email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("", "password", "127.0.0.1", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Empty password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", "", "127.0.0.1", function (err) {should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Undefined email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword(null, "", "127.0.0.1", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Undefined password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", null, "127.0.0.1", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
	    });
	});

	it('Correct email and password should not return Error', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", function (err) {
		should.not.exist(err);
		done();
	    });
	});

	it('Data base error should return error', function (done) {
	    var error = "Data base error";

	    mongooseMock.stubFindOne(function (email, callback) {
		callback(new Error(error));

	    });

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", function (err) {
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

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password2", "127.0.0.1", function (err) {
		should.exist(err);
		err.should.have.property("message", "Incorrect args");
		done();
	    });
	});

	it('Same passwords should return user', function (done) {
            var configSecretForRestore = config.app.secret;
            config.app.secret = "STUB";
	    mongooseMock.stubFindOne(function (email, callback) {
		callback(null, {
		    id: "123456789",
		    email: "user@mail.com",
                    password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5", //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
		    authToken: "",
		    save: function (callback) {
			if (callback) {
			    callback(null);
			}
		    }
		});
	    });

	    userService.findOrCreateByLoginAndPassword("user@mail.com", "passwordForSha1", "127.0.0.1", function (err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
                config.app.secret = configSecretForRestore;
		done();
	    });
	});

	it('New user should be created in data base and return token', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave();

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", function (err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });
	});
    });

    describe('Generate Hash for password.', function () {
	it('Sha1 algorithm should work', function (done) {
            var configSecretForRestore = config.app.secret;
            config.app.secret = "STUB";
	    var expected = "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5"; //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
	    var actual = userService.generateHashForPassword("user@mail.com", "passwordForSha1");
	    actual.should.be.equal(expected);
            config.app.secret = configSecretForRestore;
	    done();
	});
    });

    describe('Is password correct.', function () {
	it('Same passwords return true', function (done) {
            var configSecretForRestore = config.app.secret;
            config.app.secret = "STUB";
	    var user = {
		email: "user@mail.com",
		password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5" //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
	    };
	    var actual = userService.isPasswordCorrect("passwordForSha1", user);
	    actual.should.be.true;
            config.app.secret = configSecretForRestore;
	    done();

	});

	it('Differents passwords return false', function (done) {
            var configSecretForRestore = config.app.secret;
            config.app.secret = "STUB";
	    var user = {
		email: "user@mail.com",
		password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5" //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
	    };
	    var actual = userService.isPasswordCorrect("differentPassword", user);
	    actual.should.be.false;
            config.app.secret = configSecretForRestore;
	    done();
	});
    });

    describe('Find or create by FB data.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Wrong data without email from facebook', function (done) {
	    userService.findOrCreateByFBData({email: null, ip: "127.0.0.1"}, function (err) {
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

	    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err) {
		should.exist(err);
		err.should.have.property("message", "Data base error");
		done();
	    });
	});
	it('User exist', function (done) {
	    mongooseMock.stubFindOne();

	    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err, userId) {
		should.not.exist(err);
		should.exist(userId);
		done();
	    });
	});
	it('Create user', function (done) {
	    mongooseMock.stubSave().stubFindOneWithNotFoundUser();

	    userService.findOrCreateByFBData({email: "user@mail.com", id: "23131231", ip: "127.0.0.1"}, function (err, userId) {
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
	    userService.findOrCreateAnonymous(null, "127.0.0.1", function (err, response) {
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

	    userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", function(err, response) {
		should.exist(err);
		err.should.have.property("message", error);
		done();
	    });
	});

	it('Anonymous user already exists', function (done) {
	    mongooseMock.stubFindOne();

	    userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", function(err, response) {
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

	    userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", function(err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });

	});
    });

    describe('For user with token without spam.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Banned user get Forbidden error', function (done) {
	    var resetTime = Date.now() + config.app.limit.ban;
	    mongooseMock.stubFindOneWithBannedUser(resetTime).stubSave();

	    userService.forUserWithTokenWithoutSpam("bannedToken", "127.0.0.1", function (err, user) {
		should.exists(err);
		err.rando.should.be.eql({
		    status: 403,
		    code: 411,
		    message: "Forbidden. Reset: " + resetTime,
		    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});

	it('Banned user with old reset time does not get Forbidden error', function (done) {
	    var resetTime = Date.now() - 100;
	    mongooseMock.stubFindOneWithBannedUser(resetTime).stubSave();

	    userService.forUserWithTokenWithoutSpam("bannedToken", "127.0.0.1", function (err, user) {
		should.not.exists(err);
		should.exists(user);
		done();
	    });
	});

	it('User with not enough randos retun withot errors', function (done) {
	    var resetTime = Date.now() - 100;
	    mongooseMock.stubFindOne().stubSave();

	    userService.forUserWithTokenWithoutSpam("bannedToken", "127.0.0.1", function (err, user) {
		should.not.exists(err);
		should.exists(user);
		done();
	    });
	});

	it('User with a lot of legal randos return without errors', function (done) {
	    var randos = [];
	    for (var i = 0; i < config.app.limit.images + 10; i++) {
		var creation = Date.now() - i * 100000000;
		randos.push({
		    stranger: {
			creation: creation
		    },
		    user: {
			creation: creation
		    }
		});
	    }

	    mongooseMock.stubFindOne(function (token, callback) {
		callback(null, {
		    email: "user@mail.com",
		    authToken: "token",
		    ban: "",
		    ip: "127.0.0.1",
		    randos: randos,
		    save: function (callback) {
			if (callback) {
			    callback(null);
			};
		    }
		});
	    }).stubSave();

	    userService.forUserWithTokenWithoutSpam("token", "127.0.0.1", function (err, user) {
		should.not.exists(err);
		should.exists(user);
		done();
	    });
	});

	it('User with spam should get Forbidden error', function (done) {
	    var randos = [];
	    for (var i = 0; i < config.app.limit.images + 10; i++) {
		var creation = Date.now() + i;
		randos.push({
		    stranger: {
			creation: creation
		    },
		    user: {
			creation: creation
		    }
		});
	    }

	    mongooseMock.stubFindOne(function (token, callback) {
		callback(null, {
		    email: "user@mail.com",
		    authToken: "token",
		    ban: "",
		    ip: "127.0.0.1",
		    randos: randos,
		    save: function (callback) {
			if (callback) {
			    callback(null);
			};
		    }
		});
	    }).stubSave();


	    userService.forUserWithTokenWithoutSpam("token", "127.0.0.1", function (err, user) {
		should.exists(err);
		err.rando.should.have.property("status", 403);
		err.rando.should.have.property("code", 411);
		err.rando.should.have.property("description", "See https://github.com/RandoApp/Rando/wiki/Errors");
		err.rando.message.should.match(/^Forbidden. Reset: \d+$/);
		done();
	    });
	});
	
    });

    describe('For user with token.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Empty token should return Unauthorized error', function (done) {
	    userService.forUserWithToken(undefined, "127.0.0.1", function (err, user) {
		should.exist(err);
		err.rando.should.be.eql({
		    status: 401,
		    code: 400,
		    message: "Unauthorized",
		    description: "You are not authorized. See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});

	it('Not found user with token should return Unauthorized error', function (done) {
	    mongooseMock.stubFindOneWithNotFoundUser().stubSave();

	    userService.forUserWithToken("sometoken", "127.0.0.1", function (err, user) {
		should.exist(err);
		err.rando.should.be.eql({
		    status: 401,
		    code: 400,
		    message: "Unauthorized",
		    description: "You are not authorized. See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});

	it('DB error should return System error', function (done) {
	    var error = "Some db error";
	    mongooseMock.stubFindOne(function (token, callback) {
		callback(new Error(error));
	    });

	    userService.forUserWithToken("sometoken", "127.0.0.1", function (err, user) {
		should.exist(err);
		err.rando.should.be.eql({
		    status: 500,
		    code: 501,
		    message: "Internal Server Error",
		    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});

	it('Exist user should be returend without error', function (done) {
	    mongooseMock.stubFindOneWithEmptyUser().stubSave();

	    userService.forUserWithToken("sometoken", "127.0.0.1", function (err, user) {
		should.not.exist(err);
		should.exist(user);
		done();
	    });
	});
    });

    describe('Update ip.', function () {

	it('User with same ip should not be updated', function (done) {
	    var isSaveCalled = false;
	    var user = {
		ip: "127.0.0.1",
		save: function () {
		    isSaveCalled = true;
		}
	    }

	    userService.updateIp(user, "127.0.0.1");

	    isSaveCalled.should.be.false;
	    done();
	});

	it('User with old ip should be updated with new ip', function (done) {
	    var isSaveCalled = false;
	    var user = {
		ip: "127.0.0.3",
		save: function () {
		    isSaveCalled = true;
		}
	    }

	    userService.updateIp(user, "127.0.0.1");

	    isSaveCalled.should.be.true;
	    user.ip.should.be.eql("127.0.0.1");
	    done();
	});

	it('User without any ip should be updated with new ip', function (done) {
	    var isSaveCalled = false;
	    var user = {
		save: function () {
		    isSaveCalled = true;
		}
	    }

	    userService.updateIp(user, "127.0.0.1");

	    isSaveCalled.should.be.true;
	    user.ip.should.be.eql("127.0.0.1");
	    done();

	});
    });

    describe('Destroy auth token.', function () {
	it('AuthToken should be destroyed from user in db and return logout done as result', function (done) {
	    var isSaveCalled = false;
	    var user = {
		authToken: "someToken",
		save: function () {
		    isSaveCalled = true;
		}
	    }
	    userService.destroyAuthToken(user, function (err, result) {
		should.not.exist(err);
		isSaveCalled.should.be.true;
		user.authToken.should.be.empty;

		result.should.be.eql({
		    command: "logout",
		    result: "done"
		});

		done();
	    });
	});
    });

});

var should = require("should");
var sinon = require("sinon");
var userService = require("../../src/service/userService");
var config = require("config");
var Errors = require("../../src/error/errors");
var db = require("randoDB");


describe('User service.', function () {
    describe('Find or create user by login and password.', function () {

	it('Should return error when email is invalid', function () {
	    userService.findOrCreateByLoginAndPassword("this is not email", "", "127.0.0.1", function (err) {
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
	    });
	});

	it('Empty email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("", "password", "127.0.0.1", function (err) {
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
	    });
	});

	it('Empty password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", "", "127.0.0.1", function (err) {should.exist(err);
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
	    });
	});

	it('Undefined email should return Error', function () {
	    userService.findOrCreateByLoginAndPassword(null, "", "127.0.0.1", function (err) {
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
	    });
	});

	it('Undefined password should return Error', function () {
	    userService.findOrCreateByLoginAndPassword("this@is.email", null, "127.0.0.1", function (err) {
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
	    });
	});

	it('Correct email and password should not return Error', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
                callback();
            });

            sinon.stub(db.user, "create", function (user, callback) {
                db.user.create.restore();
                callback();
            });

	    userService.findOrCreateByLoginAndPassword("user@mail.com", "password", "127.0.0.1", function (err) {
		should.not.exist(err);
		done();
	    });
	});

	it('Data base error should return error', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
                callback(new Error("Db error"));
            });

	    userService.findOrCreateByLoginAndPassword("email@mail.com", "password", "127.0.0.1", function (err) {
		err.rando.should.be.eql(Errors.System(new Error()).rando);
		done();
	    });
	});

	it('Differents passwords should return error', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(null, {email: "user@mail.com", password: "different"});
            });

	    userService.findOrCreateByLoginAndPassword("user@mail.com", "password2", "127.0.0.1", function (err) {
		err.should.be.eql(Errors.LoginAndPasswordIncorrectArgs());
		done();
	    });
	});

	it('Same passwords should return user', function (done) {
            var configSecretForRestore = config.app.secret;
            config.app.secret = "STUB";
            console.log("SECRET: " + config.app.secret);
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(null, {
		    email: "user@mail.com",
                    password: "99ee0b6fce831af48ffd5c9d9ad5f05fa24381d5", //echo -n "passwordForSha1user@mail.comSTUB" | sha1sum
		    authToken: "",
                    ip: ""
                });
            });

            sinon.stub(db.user, "update", function (user, callback) {
                db.user.update.restore();
                callback();
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
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
                callback();
            });

            sinon.stub(db.user, "create", function (email, callback) {
                db.user.create.restore();
                callback();
            });

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
	it('Wrong data without email from facebook', function (done) {
	    userService.findOrCreateByFBData({email: null, ip: "127.0.0.1"}, function (err) {
                err.rando.should.be.eql(Errors.FBIncorrectArgs().rando);
		done();
	    });

	});

	it('No data from facebook', function (done) {
	    userService.findOrCreateByFBData(null, function (err) {
                err.rando.should.be.eql(Errors.FBIncorrectArgs().rando);
		done();
	    });
	});
	it('Database error', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(new Error("Data base error"));
	    });

	    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err) {
		err.rando.should.be.eql(Errors.System(new Error()).rando);
		done();
	    });
	});
	it('User exist', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(null, {user: "user@mail.com"});
	    });

	    userService.findOrCreateByFBData({email: "user@mail.com", ip: "127.0.0.1"}, function (err, userId) {
		should.not.exist(err);
		should.exist(userId);
		done();
	    });
	});
	it('Create user', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback();
	    });

            sinon.stub(db.user, "create", function (user, callback) {
                db.user.create.restore();
		callback();
	    });

	    userService.findOrCreateByFBData({email: "user@mail.com", id: "23131231", ip: "127.0.0.1"}, function (err, userId) {
		should.not.exist(err);
		should.exist(userId);
		done();
	    });
	});
    });
    //TODO: !!!!!!!make assertion more strongly!!!!!!!!
    describe('Get user.', function () {
	it('Get user successfully', function (done) {
	    userService.getUser({email: "user@mail.com", gifts: [{randoId: 123}], receives: [{randoId: 456}]}, function (err, user) {
		should.not.exist(err);
		should.exist(user);
		//TODO: make assertion more strongly;
		user.should.have.property("email", "user@mail.com");
		user.gifts.should.not.be.empty;
		user.receives.should.not.be.empty;
		done();
	    });
	});
    });
    describe('Find Or Create Anonymouse.', function () {
	it('Not defined id should return error', function (done) {
	    userService.findOrCreateAnonymous(null, "127.0.0.1", function (err, response) {
		should.exist(err);
		err.should.have.property("message", "Id is not correct");
		done();
	    });
	});

	it('Error in database should return system error', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(new Error("Data base error"));
	    });

	    userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", function(err, response) {
		err.rando.should.be.eql(Errors.System(new Error()).rando);
		done();
	    });
	});

	it('Anonymous user already exists', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback(null, {
                    email: "efab3c3@rando4.me",
                    authToken: "12312j1k2j3o12j31"
                });
	    });

            sinon.stub(db.user, "update", function (user, callback) {
                db.user.update.restore();
                callback();
            });

	    userService.findOrCreateAnonymous("efab3c3", "127.0.0.1", function(err, response) {
		should.not.exist(err);
		response.should.have.property("token");
		response.token.should.not.be.empty;
		done();
	    });
	});
	
	it('Anonymous should be created in database if not found', function (done) {
            sinon.stub(db.user, "getByEmail", function (email, callback) {
                db.user.getByEmail.restore();
		callback();
	    });

            sinon.stub(db.user, "create", function (user, callback) {
                db.user.create.restore();
		user.should.have.property("email", "efab3c3@rando4.me");
		user.should.have.property("anonymousId", "efab3c3");
                callback();
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

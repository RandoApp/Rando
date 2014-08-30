var should = require("should");
var sinon = require("sinon");
var access = require("../../src/service/access");
var config = require("config");
var Errors = require("../../src/error/errors");
var db = require("randoDB");

describe('Access service.', function () {
    describe('No Spam.', function () {

	it('Banned user get Forbidden error', function (done) {
            var resetTime = Date.now() + config.app.limit.ban;
            var user = {
                email: "user@mail.com",
                ban: resetTime,
                ip: "127.0.0.1",
                authToken: "bannedToken",
                facebookId: "111111",
                gifts: [],
                receives: []
            };

            access.noSpam({user: user}, {
                status: function (status) {
                    status.should.be.eql(403);
                    return this;
                },
                send: function (response) {
                    response.should.be.eql({
                        status: 403,
                        code: 411,
                        message: "Forbidden. Reset: " + resetTime,
                        description: "See https://github.com/RandoApp/Rando/wiki/Errors"
                    });
                    done();
                }
            }, null);
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
});

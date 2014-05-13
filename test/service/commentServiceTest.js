var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var mongooseMock = require("../util/mongooseMock");

describe('Comment service.', function () {
    describe('FindUserWithRando.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Should find user and rando', function (done) {
	    mongooseMock.stubFindById();

	    commentService.findUserWithRando("55af543ad25434", "3333", function (err, user, rando) {
		should.not.exist(err);
		should.exist(user);
		rando.should.be.eql({
		    user: {
			user: "524ea2324a590391a3e8b516",
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			randoId: "3333",
			imageURL: "http://rando4.me/image/3333",
			mapURL: "http://rando4.me/image/4444",
			report: 0
		    },
		    stranger: {
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			user: "724ea2324a590391a3e8b516",
			randoId: "3333",
			imageURL: "http://rando4.me/image/3333",
			mapURL: "http://rando4.me/map/444",
			report: 0
		    }
		});

		done();
	    });
	});

	it('Should return imageNotFound error if randos not exist or empty', function (done) {
	    mongooseMock.stubFindById(function (id, callback) {
		callback(null, {randos:[]});
	    });

	    commentService.findUserWithRando("55af543ad25434", "3333", function (err, user, rando) {
		should.exist(err);
		err.rando.should.be.eql({
		    status: 400,
		    code: 403,
		    message: "Rando not found",
			description: "See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});

	it('Should return system error, when data base return error', function (done) {
	    var error = "Database error";
	    mongooseMock.stubFindById(function (id, callback) {
		callback(new Error(error));
	    });

	    commentService.findUserWithRando("55af543ad25434", "3333", function (err, user, rando) {
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

	it('Should return userNotFound error, when user not exist', function (done) {
	    mongooseMock.stubFindByIdWithNotFoundUser();

	    commentService.findUserWithRando("55af543ad25434", "3333", function (err, user, rando) {
		should.exist(err);
		err.rando.should.be.eql({
		    status: 400,
		    code: 402,
		    message: "User not found",
			description: "See https://github.com/RandoApp/Rando/wiki/Errors"
		});
		done();
	    });
	});
    });

    describe('UpdateRando.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Updater should be called', function (done) {
	    var updaterCalled = false;
	    mongooseMock.stubFindById();

	    commentService.updateRando("55af543ad25434", "3333", function (rando) {
		updaterCalled = true;
	    }, function (err, rando) {
		should.not.exist(err);
		updaterCalled.should.be.true;
		done();
	    });
	});

	it('Should return system error, if database error', function (done) {
	    var updaterCalled = false;
	    mongooseMock.stubFindById(function(id, callback) {
		callback(new Error("db error"));
	    });

	    commentService.updateRando("55af543ad25434", "3333", function (rando) {
		updaterCalled = true;
	    }, function (err, rando) {
		updaterCalled.should.be.false;
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
    });


    describe('Report.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Successful report', function (done) {
	    var user = {
		id: "54dwf245d41",
		randos:[{
		    user: {
			user: "524ea2324a590391a3e8b516",
			randoId: "3333",
			report: 0
		    },
		    stranger: {
			user: "724ea2324a590391a3e8b516",
			randoId: "3333",
			report: 0
		    }
		}],
		save: function (callback) {
		    if (callback) {
			callback(null);
		    }
		}
	    }

	    mongooseMock.stubFindById(function(id, callback) {
		callback(null, user);
	    });

	    commentService.report("54dwf245d41", "3333", function (err) {
		should.not.exist(err);
		user.randos[0].stranger.report.should.be.equal(1);
		//findById stub return self user:
		user.randos[0].user.report.should.be.equal(1);
		done();
	    });
	});
    });
});

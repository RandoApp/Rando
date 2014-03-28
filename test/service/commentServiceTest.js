var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var mongooseMock = require("../util/mongooseMock");

describe('Comment service.', function () {
    describe('FindUserWithFood.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Should find user and food', function (done) {
	    mongooseMock.stubFindById();

	    commentService.findUserWithFood("55af543ad25434", "3333", function (err, user, food) {
		should.not.exist(err);
		should.exist(user);
		food.should.be.eql({
		    user: {
			user: "524ea2324a590391a3e8b516",
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			foodId: "3333",
			foodUrl: "http://api.foodex.com/food/3333",
			mapUrl: "http://api.foodex.com/food/4444",
			report: 0,
			bonAppetit: 0
		    },
		    stranger: {
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			user: "724ea2324a590391a3e8b516",
			foodId: "3333",
			foodUrl: "http://api.foodex.com/food/3333",
			mapUrl: "http://api.foodex.com/map/444",
			report: 0,
			bonAppetit: 0 
		    }
		});

		done();
	    });
	});

	it('Should return foodNotFound error if foods not exist or empty', function (done) {
	    mongooseMock.stubFindById(function (id, callback) {
		callback(null, {foods:[]});
	    });

	    commentService.findUserWithFood("55af543ad25434", "3333", function (err, user, food) {
		should.exist(err);
		err.foodex.should.be.eql({
		    status: 400,
		    code: 403,
		    message: "Food not found",
		    description: "See https://github.com/dimhold/foodex/wiki/Errors/#comment"
		});
		done();
	    });
	});

	it('Should return system error, when data base return error', function (done) {
	    var error = "Database error";
	    mongooseMock.stubFindById(function (id, callback) {
		callback(new Error(error));
	    });

	    commentService.findUserWithFood("55af543ad25434", "3333", function (err, user, food) {
		should.exist(err);
		err.foodex.should.be.eql({
		    status: 500,
		    code: 501,
		    message: "Internal Server Error",
		    description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
		});
		done();
	    });
	});

	it('Should return userNotFound error, when user not exist', function (done) {
	    mongooseMock.stubFindByIdWithNotFoundUser();

	    commentService.findUserWithFood("55af543ad25434", "3333", function (err, user, food) {
		should.exist(err);
		err.foodex.should.be.eql({
		    status: 400,
		    code: 402,
		    message: "User not found",
		    description: "See https://github.com/dimhold/foodex/wiki/Errors/#comment"
		});
		done();
	    });
	});
    });

    describe('UpdateFood.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Updater should be called', function (done) {
	    var updaterCalled = false;
	    mongooseMock.stubFindById();

	    commentService.updateFood("55af543ad25434", "3333", function (food) {
		updaterCalled = true;
	    }, function (err, food) {
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

	    commentService.updateFood("55af543ad25434", "3333", function (food) {
		updaterCalled = true;
	    }, function (err, food) {
		updaterCalled.should.be.false;
		should.exist(err);
		err.foodex.should.be.eql({
		    status: 500,
		    code: 501,
		    message: "Internal Server Error",
		    description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
		});
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
	    var user = {
		id: "54dwf245d41",
		foods:[{
		    user: {
			user: "524ea2324a590391a3e8b516",
			foodId: "3333",
			bonAppetit: 0
		    },
		    stranger: {
			user: "724ea2324a590391a3e8b516",
			foodId: "3333",
			bonAppetit: 0 
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

	    commentService.bonAppetit("54dwf245d41", "3333", function (err) {
		should.not.exist(err);
		user.foods[0].stranger.bonAppetit.should.be.equal(1);
		//findById stub return self user:
		user.foods[0].user.bonAppetit.should.be.equal(1);
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
		foods:[{
		    user: {
			user: "524ea2324a590391a3e8b516",
			foodId: "3333",
			report: 0
		    },
		    stranger: {
			user: "724ea2324a590391a3e8b516",
			foodId: "3333",
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
		user.foods[0].stranger.report.should.be.equal(1);
		//findById stub return self user:
		user.foods[0].user.report.should.be.equal(1);
		done();
	    });
	});
    });
});

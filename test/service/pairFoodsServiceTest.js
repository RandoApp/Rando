var should = require("should");
var sinon = require("sinon");
var pairFoodsService = require("../../src/service/pairFoodsService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Foods Service.', function () {
    describe('Pair Foods.', function () {
	beforeEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	afterEach(function (done) {
	    mongooseMock.restore();
	    if (pairFoodsService.findAndPairFoods.restore) {
		pairFoodsService.findAndPairFoods.restore();
	    }
	    done();
	});

	it('pairFoods should do nothing if data base error', function (done) {
	    var error = "Database error";
	    mongooseMock.stubFind(function (callback) {
		callback(new Error(error));
	    });

	    var findAndPairFoods = false;
	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		findAndPairFoods = true;
	    });

	    pairFoodsService.pairFoods();

	    findAndPairFoods.should.be.false;
	    done();
	});

	it('pairFoods should pass all foods with correct creation', function (done) {
	    var foodsStub = [{creation: 12345}, {creation: 12345}, {creation: 12345}];
	    mongooseMock.stubFind(function (callback) {
		callback(null, foodsStub);
	    });

	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		foods.should.be.eql(foodsStub);
		done();
	    });

	    pairFoodsService.pairFoods();
	});

	it('pairFoods should ignore foods without creation', function (done) {
	    var foodsStub = [{creation: 12345}, {creation: 0}, {creation: 23456}];
	    mongooseMock.stubFind(function (callback) {
		callback(null, foodsStub);
	    });

	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		foods.should.be.eql([{creation: 12345}, {creation: 23456}]);
		done();
	    });

	    pairFoodsService.pairFoods();
	});

	it('pairFoods should ignore foods with bad creation', function (done) {
	    var foodsStub = [{creation: 0}, {creation: null}, {}];
	    mongooseMock.stubFind(function (callback) {
		callback(null, foodsStub);
	    });

	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		foods.should.be.empty;
		done();
	    });

	    pairFoodsService.pairFoods();
	});

	it('pairFoods should ignore empty foods', function (done) {
	    mongooseMock.stubFind(function (callback) {
		callback(null, []);
	    });

	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		foods.should.be.empty;
		done();
	    });

	    pairFoodsService.pairFoods();
	});

	it('pairFoods should do nothing if foods not found', function (done) {
	    mongooseMock.stubFind(function (callback) {
		callback(null, null);
	    });

	    var findAndPairFoods = false;
	    sinon.stub(pairFoodsService, "findAndPairFoods", function (foods) {
		findAndPairFoods = true;
	    });

	    pairFoodsService.pairFoods();
	    findAndPairFoods.should.be.false;
	    done();
	});

	it('FindAndPairFoods should call connectFoods if pairs exists', function (done) {
	    var connectFoodsCalled = false;
	    sinon.stub(pairFoodsService, "connectFoods", function (food1, food2) {
		connectFoodsCalled = true;
	    });

	    var foods = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];

	    pairFoodsService.findAndPairFoods(foods);

	    connectFoodsCalled.should.be.true;

	    pairFoodsService.connectFoods.restore();
	    done();
	});

	it('FindAndPairFoods should do nothing if foods is emapty array', function (done) {
	    var connectFoodsCalled = false;
	    sinon.stub(pairFoodsService, "connectFoods", function (food1, food2) {
		connectFoodsCalled = true;
	    });

	    var findFoodForUserCalled = false;
	    sinon.stub(pairFoodsService, "findFoodForUser", function (currentFood, foods) {
		findFoodForUserCalled = true;
	    });

	    var foods = [];

	    pairFoodsService.findAndPairFoods(foods);

	    connectFoodsCalled.should.be.false;
	    findFoodForUserCalled.should.be.false;

	    pairFoodsService.connectFoods.restore();
	    pairFoodsService.findFoodForUser.restore();
	    done();
	});

	it('FindAndPairFoods should do nothing if findFoodForUser return not food', function (done) {
	    var findFoodForUserCalled = false;
	    sinon.stub(pairFoodsService, "findFoodForUser", function (currentFood, foods) {
		findFoodForUserCalled = true;
		return null;
	    });

	    var connectFoodsCalled = false;
	    sinon.stub(pairFoodsService, "connectFoods", function (food1, food2) {
		connectFoodsCalled = true;
	    });

	    var foods = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];

	    pairFoodsService.findAndPairFoods(foods);

	    findFoodForUserCalled.should.be.true;
	    connectFoodsCalled.should.be.false;

	    pairFoodsService.connectFoods.restore();
	    pairFoodsService.findFoodForUser.restore();
	    done();
	});

	it('FindAndPairFoods should do nothing if input array is bad', function (done) {
	    var findFoodForUserCalled = false;
	    sinon.stub(pairFoodsService, "findFoodForUser", function (currentFood, foods) {
		findFoodForUserCalled = true;
	    });

	    var connectFoodsCalled = false;
	    sinon.stub(pairFoodsService, "connectFoods", function (food1, food2) {
		connectFoodsCalled = true;
	    });

	    var foods = undefined;

	    pairFoodsService.findAndPairFoods(foods);

	    findFoodForUserCalled.should.be.false;
	    connectFoodsCalled.should.be.false;

	    pairFoodsService.connectFoods.restore();
	    pairFoodsService.findFoodForUser.restore();
	    done();
	});

	it('FindFoodForUser should find first other user and update initial foods array', function (done) {
	    var foods = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];
	    var food = {user: 12345};

	    var actual = pairFoodsService.findFoodForUser(food, foods);

	    actual.should.be.eql({user: 45678});
	    foods.should.have.length(3);
	    
	    done();
	});

	it('FindFoodForUser empty foods array should return null', function (done) {
	    var foods = [];
	    var food = {user: 12345};

	    var actual = pairFoodsService.findFoodForUser(food, foods);

	    (actual === null).should.be.true;
	    foods.should.have.length(0);
	    
	    done();
	});

	it('FindFoodForUser should return null if user for pairing not found', function (done) {
	    var foods = [{user: 12345}, {user: 12345}, {user: 12345}];
	    var food = {user: 12345};

	    var actual = pairFoodsService.findFoodForUser(food, foods);

	    (actual === null).should.be.true;
	    foods.should.have.length(3);
	    
	    done();
	});

	it('Database error shuld return processFoodForUser without any action', function (done) {
	    var error = "Data base error";
	    var userUpdateCalled = false;
	    var foodRemoveCalled = false;
	    mongooseMock.stubFindById(function (userId, callback) {
		callback(new Error(error));
	    }).stubSave(function () {
		updateCalled = true;
	    }).stubRemove(function () {
		foodRemoveCalled = true;
	    });
	    pairFoodsService.processFoodForUser("1234", {});

	    userUpdateCalled.should.be.false;
	    foodRemoveCalled.should.be.false;

	    done();
	});

	it('Process Food For User should do nothing if user not found ', function (done) {
	    var userUpdateCalled = false;
	    var foodRemoveCalled = false;
	    mongooseMock.stubFindById(function (userId, callback) {
		callback(null, null);
	    }).stubSave(function () {
		updateCalled = true;
	    }).stubRemove(function () {
		foodRemoveCalled = true;
	    });
	    pairFoodsService.processFoodForUser("1234", {});

	    userUpdateCalled.should.be.false;
	    foodRemoveCalled.should.be.false;

	    done();
	});

	it('Pairing should update user and remove food from database', function (done) {
	    var userUpdateCalled = false;
	    mongooseMock.stubFindOne(function (user, callback) {
		callback(null, {
			save: function () {
			    userUpdateCalled = true;
			},
			id: "524ea2324a590391a3e8b516",
			facebookId: "111111",
			foods: [{
			    user: {
				email: "user@mail.com",
				user: "524ea2324a590391a3e8b516",
				location: "1111.1111, 1111.1111",
				foodId: "3333",
				foodUrl: "http://api.foodex.com/food/3333",
				creation: 123456789,
				mapUrl: "http://api.foodex.com/food/4444",
				bonAppetit: false
			    },
			    stranger: {
				email: "",
				user: "",
				location: "",
				foodId: "",
				foodUrl: "",
				mapUrl: "",
				report: false,
				bonAppetit: false
			    }
			}]
		    }
		);
	    });

	    var foodRemoveCalled = false;
	    pairFoodsService.processFoodForUser("1234", {remove: function () {
		foodRemoveCalled = true;
	    }});

	    userUpdateCalled.should.be.true;
	    foodRemoveCalled.should.be.true;

	    done();
	});
    });

    describe('Demon lifecycle.', function () {
	it('Demon should start intervals and save intervalTimer', function(done) {
	    pairFoodsService.stopDemon();
	    should.not.exist(pairFoodsService.timer);

	    pairFoodsService.startDemon();
	    should.exist(pairFoodsService.timer);
	    done();
	});

	it('Demon should stop intervals and remove intervalTimer', function(done) {
	    pairFoodsService.startDemon();
	    should.exist(pairFoodsService.timer);

	    pairFoodsService.stopDemon();
	    should.not.exist(pairFoodsService.timer);
	    done();
	});

	it('Demon should do nonthing on stopDemon if startDemon not be called before', function(done) {
	    pairFoodsService.stopDemon();
	    should.not.exist(pairFoodsService.timer);

	    pairFoodsService.stopDemon();
	    (null == pairFoodsService.timer).should.be.true;
	    done();
	});
    });

});

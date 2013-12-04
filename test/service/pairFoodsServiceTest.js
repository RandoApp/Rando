var should = require("should");
var sinon = require("sinon");
var pairFoodsService = require("../../src/service/pairFoodService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Foods Service.', function () {
    describe('Pair Foods.', function () {
	afterEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	it('Map', function (done) {
	    pairFoodsService.pairFoods();
	});
    });
});

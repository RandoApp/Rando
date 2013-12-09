var should = require("should");
var sinon = require("sinon");
var pairFoodsService = require("../../src/service/pairFoodsService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Foods Service.', function () {
    describe('Pair Foods.', function () {
	it('PairFoods', function (done) {
//	    pairFoodsService.pairFoods();
	    //TODO: Implement test
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

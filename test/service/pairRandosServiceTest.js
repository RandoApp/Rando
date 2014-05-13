var should = require("should");
var sinon = require("sinon");
var pairRandosService = require("../../src/service/pairRandosService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Randos Service.', function () {
    describe('Pair Randos.', function () {
	beforeEach(function (done) {
	    mongooseMock.restore();
	    done();
	});

	afterEach(function (done) {
	    mongooseMock.restore();
	    if (pairRandosService.findAndPairRandos.restore) {
		pairRandosService.findAndPairRandos.restore();
	    }
	    if (pairRandosService.connectRandos.restore) {
		pairRandosService.connectRandos.restore();
	    }
	    if (pairRandosService.findRandoForUser.restore) {
		pairRandosService.findRandoForUser.restore();
	    }
	    if (pairRandosService.processRandoForUser.restore) {
		pairRandosService.processRandoForUser.restore();
	    }
	    done();
	});
	it('connectRandos should trigger processRandoForUser with userId and rando as args', function (done) {
	    sinon.stub(pairRandosService, "processRandoForUser", function (userId, rando) {
		if (userId == 12345) {
		    rando.should.be.eql({user: 56789});
		    return;
		}

		if (userId == 56789) {
		    rando.should.be.eql({user: 12345});
		    return;
		}

		throw new Error("Unknown userId: " + userId + " in processRandoForUser function - force fail test");
	    });

	    pairRandosService.connectRandos({user: 12345}, {user: 56789});

	    done();
	});

	it('pairRandos should pair old rando if randoTimeout', function (done) {
	    var randosStub = [{creation: 12345}, {creation: 0}, {creation: 45678}, {creation: 2345}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		if (randos.length != 2) {
		    return [{creation: 12345}];
		}

		randos.should.be.eql([{creation: 0}, {creation: 12345}]);
		done();
		return [];
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should NOT pair old rando if NOT randoTimeout', function (done) {
	    var time = Date.now();
	    var randosStub = [{creation: time}, {creation: 0}, {creation: time}, {creation: time}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		if (randos.length != 2) {
		    done();
		    return [{creation: time}];
		}

		throw new Error("pairRandosService called twice. Force fail test");
	    });

	    pairRandosService.pairImages();
	});
	it('pairRandos should NOT pair old rando if oldRando not exist', function (done) {
	    var time = Date.now();
	    var randosStub = [{creation: 53433}, {creation: 12345}, {creation: 48483}, {creation: 32323}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		if (randos.length != 2) {
		    done();
		    return [{creation: 12345}];
		}

		throw new Error("pairRandosService called twice. Force fail test");
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should not pair old rando if findAndPairRandos return empty array', function (done) {
	    var randosStub = [{creation: 12345}, {creation: 0}, {creation: 45678}, {creation: 2345}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		if (randos.length != 2) {
		    return [];
		}

		throw new Error("pairRandosService called twice. Force fail test");
	    });

	    pairRandosService.pairImages();
	    done();
	});

	it('pairRandos should not pair old rando if findAndPairRandos return not zero array', function (done) {
	    var randosStub = [{creation: 12345}, {creation: 0}, {creation: 45678}, {creation: 2345}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		if (randos.length != 2) {
		    return [];
		}

		throw new Error("pairRandosService called twice. Force fail test");
	    });

	    pairRandosService.pairImages();
	    done();
	});

	it('pairRandos should do nothing if data base error', function (done) {
	    var error = "Database error";
	    mongooseMock.stubFind(function (query, callback) {
		callback(new Error(error));
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		findAndPairRandos = true;
	    });

	    pairRandosService.pairImages();

	    findAndPairRandos.should.be.false;
	    done();
	});

	it('pairRandos should pass all randos with correct creation', function (done) {
	    var randosStub = [{creation: 12345}, {creation: 12345}, {creation: 12345}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		randos.should.be.eql(randosStub);
		done();
		return [];
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should ignore randos without creation', function (done) {
	    var randosStub = [{creation: 12345}, {creation: 0}, {creation: 23456}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		randos.should.be.eql([{creation: 12345}, {creation: 23456}]);
		done();
		return [];
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should ignore randos with bad creation', function (done) {
	    var randosStub = [{creation: 0}, {creation: null}, {}];
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, randosStub);
	    });

	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		randos.should.be.empty;
		done();
		return [];
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should ignore empty randos', function (done) {
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, []);
	    });

	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		randos.should.be.empty;
		done();
		return [];
	    });

	    pairRandosService.pairImages();
	});

	it('pairRandos should do nothing if randos not found', function (done) {
	    mongooseMock.stubFind(function (query, callback) {
		callback(null, null);
	    });

	    var findAndPairRandos = false;
	    sinon.stub(pairRandosService, "findAndPairRandos", function (randos) {
		findAndPairRandos = true;
		return [];
	    });

	    pairRandosService.pairImages();
	    findAndPairRandos.should.be.false;
	    done();
	});

	it('FindAndPairRandos should call connectRandos if pairs exists', function (done) {
	    var connectRandosCalled = false;
	    sinon.stub(pairRandosService, "connectRandos", function (rando1, rando2) {
		connectRandosCalled = true;
	    });

	    var randos = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];

	    pairRandosService.findAndPairRandos(randos);

	    connectRandosCalled.should.be.true;

	    done();
	});

	it('FindAndPairRandos should do nothing if randos is emapty array', function (done) {
	    var connectRandosCalled = false;
	    sinon.stub(pairRandosService, "connectRandos", function (rando1, rando2) {
		connectRandosCalled = true;
	    });

	    var findRandoForUserCalled = false;
	    sinon.stub(pairRandosService, "findRandoForUser", function (currentRando, randos) {
		findRandoForUserCalled = true;
	    });

	    var randos = [];

	    pairRandosService.findAndPairRandos(randos);

	    connectRandosCalled.should.be.false;
	    findRandoForUserCalled.should.be.false;

	    done();
	});

	it('FindAndPairRandos should do nothing if findRandoForUser return not rando', function (done) {
	    var findRandoForUserCalled = false;
	    sinon.stub(pairRandosService, "findRandoForUser", function (currentRando, randos) {
		findRandoForUserCalled = true;
		return null;
	    });

	    var connectRandosCalled = false;
	    sinon.stub(pairRandosService, "connectRandos", function (rando1, rando2) {
		connectRandosCalled = true;
	    });

	    var randos = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];

	    pairRandosService.findAndPairRandos(randos);

	    findRandoForUserCalled.should.be.true;
	    connectRandosCalled.should.be.false;
	    done();
	});

	it('FindAndPairRandos should do nothing if input array is bad', function (done) {
	    var findRandoForUserCalled = false;
	    sinon.stub(pairRandosService, "findRandoForUser", function (currentRando, randos) {
		findRandoForUserCalled = true;
	    });

	    var connectRandosCalled = false;
	    sinon.stub(pairRandosService, "connectRandos", function (rando1, rando2) {
		connectRandosCalled = true;
	    });

	    var randos = undefined;

	    pairRandosService.findAndPairRandos(randos);

	    findRandoForUserCalled.should.be.false;
	    connectRandosCalled.should.be.false;

	    done();
	});

	it('FindRandoForUser should find first other user and update initial randos array', function (done) {
	    var randos = [{user: 12345}, {user: 12345}, {user: 45678}, {user: 56789}];
	    var rando = {user: 12345};

	    var actual = pairRandosService.findRandoForUser(rando, randos);

	    actual.should.be.eql({user: 45678});
	    randos.should.have.length(3);
	    
	    done();
	});

	it('FindRandoForUser empty randos array should return null', function (done) {
	    var randos = [];
	    var rando = {user: 12345};

	    var actual = pairRandosService.findRandoForUser(rando, randos);

	    (actual === null).should.be.true;
	    randos.should.have.length(0);
	    
	    done();
	});

	it('FindRandoForUser should return null if user for pairing not found', function (done) {
	    var randos = [{user: 12345}, {user: 12345}, {user: 12345}];
	    var rando = {user: 12345};

	    var actual = pairRandosService.findRandoForUser(rando, randos);

	    (actual === null).should.be.true;
	    randos.should.have.length(3);
	    
	    done();
	});

	it('Database error shuld return processRandoForUser without any action', function (done) {
	    var error = "Data base error";
	    var userUpdateCalled = false;
	    var randoRemoveCalled = false;
	    mongooseMock.stubFindById(function (userId, callback) {
		callback(new Error(error));
	    }).stubSave(function () {
		updateCalled = true;
	    }).stubRemove(function () {
		randoRemoveCalled = true;
	    });
	    pairRandosService.processRandoForUser("1234", {});

	    userUpdateCalled.should.be.false;
	    randoRemoveCalled.should.be.false;

	    done();
	});

	it('Process Rando For User should do nothing if user not found ', function (done) {
	    var userUpdateCalled = false;
	    var randoRemoveCalled = false;
	    mongooseMock.stubFindById(function (userId, callback) {
		callback(null, null);
	    }).stubSave(function () {
		updateCalled = true;
	    }).stubRemove(function () {
		randoRemoveCalled = true;
	    });
	    pairRandosService.processRandoForUser("1234", {});

	    userUpdateCalled.should.be.false;
	    randoRemoveCalled.should.be.false;

	    done();
	});

	it('Pairing should update user and remove rando from database', function (done) {
	    var userUpdateCalled = false;
	    mongooseMock.stubFindOne(function (user, callback) {
		callback(null, {
			save: function () {
			    userUpdateCalled = true;
			},
			id: "524ea2324a590391a3e8b516",
			facebookId: "111111",
			randos: [{
			    user: {
				email: "user@mail.com",
				user: "524ea2324a590391a3e8b516",
				location: "1111.1111, 1111.1111",
				randoId: "3333",
				randoURL: "http://api.randoex.com/rando/3333",
				creation: 123456789,
				mapURL: "http://api.randoex.com/rando/4444"
			    },
			    stranger: {
				email: "",
				user: "",
				location: "",
				randoId: "",
				randoURL: "",
				mapURL: "",
				report: false
			    }
			}]
		    }
		);
	    });

	    var randoRemoveCalled = false;
	    pairRandosService.processRandoForUser("1234", {remove: function () {
		randoRemoveCalled = true;
	    }});

	    userUpdateCalled.should.be.true;
	    randoRemoveCalled.should.be.true;

	    done();
	});
    });

    describe('Demon lifecycle.', function () {
	it('Demon should start intervals and save intervalTimer', function(done) {
	    pairRandosService.stopDemon();
	    should.not.exist(pairRandosService.timer);

	    pairRandosService.startDemon();
	    should.exist(pairRandosService.timer);
	    done();
	});

	it('Demon should stop intervals and remove intervalTimer', function(done) {
	    pairRandosService.startDemon();
	    should.exist(pairRandosService.timer);

	    pairRandosService.stopDemon();
	    should.not.exist(pairRandosService.timer);
	    done();
	});

	it('Demon should do nonthing on stopDemon if startDemon not be called before', function(done) {
	    pairRandosService.stopDemon();
	    should.not.exist(pairRandosService.timer);

	    pairRandosService.stopDemon();
	    (null == pairRandosService.timer).should.be.true;
	    done();
	});
    });

});

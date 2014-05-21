var should = require("should");
var sinon = require("sinon");
var pairService = require("../../src/service/pairService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Randos Service.', function () {
    describe('Rando To User.', function () {
	it('Rando should be added to user if he has rando to pairing', function (done) {
            mongooseMock.stubFindUserWithNotPairedRando(function(email, callback) {
                callback(null, {
                    email: "user@rando4.me",
                    randos: [{user: {email: "user@rando4.me", randoId: "1"}, stranger: {email: "stranger2@rando4.me", randoId: "2"}},
                             {user: {email: "user@rando4.me", randoId: "3"}, stranger: {email: "", randoId: ""}},
                             {user: {email: "user@rando4.me", randoId: "4"}, stranger: {email: "stranger3@rando4.me", randoId: "5"}}]
                });
            });
            var rando = {
                email: "stranger@rando4.me",
                randoId: "6"
            };

	    sinon.stub(pairService, "updateModels", function (user, rmRando) {
                rmRando.should.be.eql(rando);
                user.should.be.eql({
                    email: "user@rando4.me",
                    randos: [{user: {email: "user@rando4.me", randoId: "1"}, stranger: {email: "stranger2@rando4.me", randoId: "2"}},
                             {user: {email: "user@rando4.me", randoId: "3"}, stranger: {email: "stranger@rando4.me", randoId: "6"}},
                             {user: {email: "user@rando4.me", randoId: "4"}, stranger: {email: "stranger3@rando4.me", randoId: "5"}}]
                });

                mongooseMock.restore();
                pairService.updateModels.restore();
                done();
	    });

            pairService.randoToUser("user@rando4.me", rando);
        });

	it('Rando should be added to user if he has more than one rando to pairing', function (done) {
            mongooseMock.stubFindUserWithNotPairedRando(function(email, callback) {
                callback(null, {
                    email: "user@rando4.me",
                    randos: [{user: {email: "user@rando4.me", randoId: "1"}, stranger: {email: "stranger2@rando4.me", randoId: "6"}},
                             {user: {email: "user@rando4.me", randoId: "2"}, stranger: {email: "", randoId: ""}},
                             {user: {email: "user@rando4.me", randoId: "3"}, stranger: {email: "", randoId: ""}},
                             {user: {email: "user@rando4.me", randoId: "4"}, stranger: {email: "stranger3@rando4.me", randoId: "7"}}]
                });
            });
            var rando = {
                email: "stranger@rando4.me",
                randoId: "8"
            };

	    sinon.stub(pairService, "updateModels", function (user, rmRando) {
                rmRando.should.be.eql(rando);
                user.should.be.eql({
                    email: "user@rando4.me",
                    randos: [{user: {email: "user@rando4.me", randoId: "1"}, stranger: {email: "stranger2@rando4.me", randoId: "6"}},
                             {user: {email: "user@rando4.me", randoId: "2"}, stranger: {email: "stranger@rando4.me", randoId: "8"}},
                             {user: {email: "user@rando4.me", randoId: "3"}, stranger: {email: "", randoId: ""}},
                             {user: {email: "user@rando4.me", randoId: "4"}, stranger: {email: "stranger3@rando4.me", randoId: "7"}}]
                });

                mongooseMock.restore();
                pairService.updateModels.restore();
                done();
	    });

            pairService.randoToUser("user@rando4.me", rando);
        });
        
	it('UpdateModels should not be callled if user does not have rando to pairing', function (done) {
            mongooseMock.stubFindUserWithNotPairedRando(function(email, callback) {
                callback(null, {
                    email: "user@rando4.me",
                    randos: [{user: {email: "user@rando4.me", randoId: "1"}, stranger: {email: "stranger2@rando4.me", randoId: "6"}},
                             {user: {email: "user@rando4.me", randoId: "2"}, stranger: {email: "stranger3@rando4.me", randoId: "7"}}]
                });
            });
            var rando = {
                email: "stranger@rando4.me",
                randoId: "8"
            };

            var isUpdateModelsCalled = false;
	    sinon.stub(pairService, "updateModels", function (user, rmRando) {
                isUpdateModelsCalled = true;
	    });

            pairService.randoToUser("user@rando4.me", rando, function () {
                isUpdateModelsCalled.should.be.false;
                mongooseMock.restore();
                pairService.updateModels.restore();
                done();
            });
        });
    });
    
    describe('Update models.', function () {
	it('Rando should be added to user if he has rando to pairing', function (done) {
        });
    });
    /*
    describe('Pair.', function () {
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
    */

    describe('Demon lifecycle.', function () {
	it('Demon should start intervals and save intervalTimer', function(done) {
	    pairService.stopDemon();
	    should.not.exist(pairService.timer);

	    pairService.startDemon();
	    should.exist(pairService.timer);
	    done();
	});

	it('Demon should stop intervals and remove intervalTimer', function(done) {
	    pairService.startDemon();
	    should.exist(pairService.timer);

	    pairService.stopDemon();
	    should.not.exist(pairService.timer);
	    done();
	});

	it('Demon should do nonthing on stopDemon if startDemon not be called before', function(done) {
	    pairService.stopDemon();
	    should.not.exist(pairService.timer);

	    pairService.stopDemon();
	    (null == pairService.timer).should.be.true;
	    done();
	});
    });

});

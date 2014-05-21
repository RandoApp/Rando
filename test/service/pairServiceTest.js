var should = require("should");
var sinon = require("sinon");
var pairService = require("../../src/service/pairService");
var mongooseMock = require("../util/mongooseMock");

describe('Pair Randos Service.', function () {
    describe('Pair.', function () {
	it('DB error return error in callback', function (done) {
            var error = "DB error";
            mongooseMock.stubFind(function (query, callback) {
                callback(new Error(error));
            });

            pairService.pair(function (err) {
                should.exists(err);
                err.should.have.property("message", error);
                done();
            });
        });

	it('Do nothing for empty randos', function (done) {
            mongooseMock.stubFind(function (query, callback) {
                callback(null, []);
            });

            var isFindRandoForUserCalled = false;
            sinon.stub(pairService, "findRandoForUser", function () {
                isFindRandoForUserCalled = true;
            });
            

            pairService.pair(function () {
                isFindRandoForUserCalled.should.be.false;
                done();
            });

        });
    });

    describe('Find rando for user.', function () {
	it('Should return null if all randos from one user', function (done) {
            var randos = [{email: "user@rando4.me"}, {email: "user@rando4.me"}];
            var actual = pairService.findRandoForUser("user@rando4.me", randos);
            should.not.exists(actual);
            randos.should.be.eql([{email: "user@rando4.me"}, {email: "user@rando4.me"}]);
            done();
        });

	it('Should return null if no randos', function (done) {
            var randos = [];
            var actual = pairService.findRandoForUser("user@rando4.me", randos);
            should.not.exists(actual);
            randos.should.be.eql([]);
            done();
        });

	it('Should return if no randos', function (done) {
            var randos = [{email: "user@rando4.me"}, {email: "stranger@rando4.me"}];
            var actual = pairService.findRandoForUser("user@rando4.me", randos);
            actual.should.be.eql({email: "stranger@rando4.me"});
            randos.should.be.eql([{email: "user@rando4.me"}]);
            done();
        });

	it('Should return first stranger rando', function (done) {
            var randos = [{email: "user@rando4.me"}, {email: "stranger1@rando4.me"}, {email: "stranger2@rando4.me"}];
            var actual = pairService.findRandoForUser("user@rando4.me", randos);
            actual.should.be.eql({email: "stranger1@rando4.me"});
            randos.should.be.eql([{email: "user@rando4.me"}, {email: "stranger2@rando4.me"}]);
            done();
        });
    });

    describe('Connect Randos.', function () {
	it('Rando To User should be called twice in parallel', function (done) {
            var correctBehaviourСounter = 0;
	    sinon.stub(pairService, "randoToUser", function (email, rando, callback) {
                if (email != rando.email) {
                    correctBehaviourСounter++;
                }
                callback();
	    });

            pairService.connectRandos({email: "user1@rando4.me"}, {email: "user2@rando4.me"}, function () {
                correctBehaviourСounter.should.be.exactly(2);
                pairService.randoToUser.restore();
                done();
            });
        });

	it('Error in randoToUser should return error in callback', function (done) {
            var error = "Error in RandoToUser";
	    sinon.stub(pairService, "randoToUser", function (email, rando, callback) {
                callback(new Error(error));
	    });

            pairService.connectRandos({email: "user1@rando4.me"}, {email: "user2@rando4.me"}, function (err) {
                should.exists(err);
                err.should.have.property("message", error);
                pairService.randoToUser.restore();
                done();
            });
        });
    });

    describe('Rando To User.', function () {
	it('User not found', function (done) {
            mongooseMock.stubFindOneWithNotFoundUser();

            pairService.randoToUser("user@rando4.me", {}, function (err) {
                should.exists(err);
                err.should.have.property("message", "User not found");
                mongooseMock.restore();
                done();
            });

        });

	it('DB error', function (done) {
            var error = "DB error";
            mongooseMock.stubFindOne(function (email, callback) {
                callback(new Error(error));
            });

            pairService.randoToUser("user@rando4.me", {}, function (err) {
                should.exists(err);
                err.should.have.property("message", error);
                mongooseMock.restore();
                done();
            });
        });

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
	it('Update models should remove Rando and update user.', function (done) {
            var isUpdateUserCalled = false;
            var isRmRandoCalled = false;

            var rando = {
                remove: function (callback) {
                    isRmRandoCalled = true; 
                    callback();
                }
            };
            var user = {
                save: function (callback) {
                    isUpdateModelsCalled = true;
                    callback();
                }
            };


            pairService.updateModels(user, rando, function (err) {
                should.not.exists(err);
                isRmRandoCalled.should.be.true;
                isUpdateModelsCalled.should.be.true;
                done();
            });
        });

	it('DB error should callback error.', function (done) {
            var error = "DB error";
            var rando = {
                remove: function (callback) {
                    callback(new Error(error));
                }
            };
            var user = {
                save: function (callback) {
                    callback(new Error(error));
                }
            };
            pairService.updateModels(user, rando, function (err) {
                should.exists(err);
                err.should.have.property("message", error);
                done();
            });
        });
    });

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

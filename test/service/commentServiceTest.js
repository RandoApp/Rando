var should = require("should");
var sinon = require("sinon");
var commentService = require("../../src/service/commentService");
var db = require("randoDB");
var Errors = require("../../src/error/errors");

describe('Comment service.', function () {
    describe('Delete.', function () {

	it('Delete flag should be set to 1 in out', function (done) {
            var user = {
                email: "user@mail.com",
                out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
                in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
            };

            sinon.stub(db.user, "update", function (user, callback) {
                console.log("Stubbed user.update(): " + user.out[1].delete);
                user.out[1].delete.should.equal(1);
                db.user.update.restore();
                done();
            });

            commentService.delete(user, 456, function (err, response) {/*doesn't matter*/});
        });

	it('Delete flag should be set to 1 in in', function (done) {
            var user = {
                email: "user@mail.com",
                out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
                in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
            };

            sinon.stub(db.user, "update", function (user, callback) {
                user.in[0].delete.should.equal(1);
                db.user.update.restore();
                done();
            });

            commentService.delete(user, 789, function (err, response) {/*doesn't matter*/});
        });

	it('Should return rando not found error when cannot detect rando', function (done) {
            var user = {
                email: "user@mail.com",
                out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
                in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
            };

            commentService.delete(user, 111, function (err, response) {
                err.should.be.eql(Errors.RandoNotFound());
                done();
            });
        });

	it('Should return rando not found error when out and recives arrays is empty', function (done) {
            var user = {
                email: "user@mail.com",
                out:[],
                in:[]
            };

            commentService.delete(user, 111, function (err, response) {
                err.should.be.eql(Errors.RandoNotFound());
                done();
            });
        });

	it('Should return system error when db return error', function (done) {
            var user = {
                email: "user@mail.com",
                out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
                in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
            };

            sinon.stub(db.user, "update", function (user, callback) {
                db.user.update.restore();
                callback(new Error("Some db error"));
            });

            commentService.delete(user, 123, function (err, response) {
                err.should.be.eql(Errors.System(new Error("Some db error")));
                done();
            });
        });

	it('Service should return json response if all ok', function (done) {
            var user = {
                email: "user@mail.com",
                out:[{randoId: 123, delete: 0}, {randoId: 456, delete: 0}],
                in:[{randoId: 789, delete: 0}, {randoId: 999, delete: 0}]
            };

            sinon.stub(db.user, "update", function (user, callback) {
                db.user.update.restore();
                callback();
            });

            commentService.delete(user, 123, function (err, response) {
                response.should.be.eql({command: "delete", result: "done"});
                done();
            });
        });
    });
});

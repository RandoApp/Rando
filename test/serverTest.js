var isNotAuthorized = require("../server.js");
var should = require("should");
var sinon = require("sinon");

describe('Authorization.', function () {
    it('isNotAuthorized should send reponse with error if user not exists in session and return true', function (done) {
	var req = {session: {}};
	var res = {
	    status: function (code) {
		code.should.be.eql(401);
	    },
	    send: function (response) {
		response.should.be.eql({
		    status: 401,
		    code: 400,
		    message: "Unauthorized",
		    description: "You are not authorized. See https://github.com/dimhold/foodex/wiki/Errors/#unauthorized"
		});
	    }
	}

	var notAuthorized = isNotAuthorized(req, res); 
	notAuthorized.should.be.true;
	done();
    });
    it('isNotAuthorized should return false if user in session exists', function (done) {
	var req = {session: {passport: {user: 1111}}};
	var notAuthorized = isNotAuthorized(req); 
	notAuthorized.should.be.false
	done();
    });
});

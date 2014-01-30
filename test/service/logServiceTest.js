var should = require("should");
var logService = require("../../src/service/logService");
var fs = require("fs");
var sinon = require("sinon");

describe('Log service.', function () {
    describe('generate log name.', function () {
	it('Should generate file name with anonymous prefix and date', function (done) {
	    var logName = logService.generateLogName("anonymous");
	    logName.should.match(/^anonymous\d+.log$/)
	    done();
	});

	it('Should generate file name with email prefix and date', function (done) {
	    var logName = logService.generateLogName("user@mail.com");
	    logName.should.match(/^user@mail.com\d+.log$/)
	    done();
	});
    });
    describe('Store log.', function () {
	it('Store log with error should return error', function (done) {
	    sinon.stub(fs, "writeFile", function (fileName, data, callback) {
		fs.writeFile.restore();
		callback(new Error("Some error"));
	    });
	    logService.storeLog("user@mail.com", "some log data", function (err) {
		err.should.exist;
		done();
	    });
	});

	it('Store log without error should return result done', function (done) {
	    sinon.stub(fs, "writeFile", function (fileName, data, callback) {
		fs.writeFile.restore();
		callback(null);
	    });
	    logService.storeLog("user@mail.com", "some log data", function (err) {
		should.not.exist(err);
		done();
	    });
	});
    });
});

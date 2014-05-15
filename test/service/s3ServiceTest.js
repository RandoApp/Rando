var should = require("should");
var config = require("config");
var s3Service = require("../../src/service/s3Service");
var s3 = require("s3");

describe('S3 service.', function () {
    describe('Get S3 file name.', function () {
	it('S3 file name should be just filename and extension', function (done) {
            var s3FileName = s3Service.getS3FileName("/tmp/somejpgdir/file234.jpg");
            s3FileName.should.be.eql("file234.jpg");
            done();
        });

	it('S3 file name should be just last match filename and extension', function (done) {
            var s3FileName = s3Service.getS3FileName("/tmp/dir.jpg/file234.jpg");
            s3FileName.should.be.eql("file234.jpg");
            done();
        });

	it('S3 file name should be just filename and extension', function (done) {
            var s3FileName = s3Service.getS3FileName("not a jpg file");
            should.not.exist(s3FileName);
            done();
        });
    });

    describe('Process uploader.', function () {
	it('Should not return any error if file uploaded', function (done) {
            var uploaderStub = {
                on: function (event, onDone) {
                    if (event == "end") {
                        onDone(null, {});
                    }
                    return this;
                }
            };

            s3Service.processUploader(uploaderStub, function (err, url) {
                should.not.exist(err);
                done();
            });
        });

	it('Should return error if file uploaded with error', function (done) {
            var error = "S3 Error";

            var uploaderStub = {
                on: function (event, onDone) {
                    if (event == "error") {
                        onDone(new Error(error));
                    }
                    return this;
                }
            };

            s3Service.processUploader(uploaderStub, function (err, url) {
                should.exist(err);
                err.should.have.property("message", error);
                done();
            });
        });

	it('Should set porogress', function (done) {
            var error = "S3 Error";

            var uploaderStub = {
                on: function (event, onDone) {
                    if (event == "progress") {
                        this.progressAmount = 10;
                        this.progressTotal = 200;
                    } else if (event == "end") {
                        onDone();
                    }
                    return this;
                }
            };

            s3Service.processUploader(uploaderStub, function (err, url) {
                uploaderStub.should.have.property("progressAmount", 10);
                uploaderStub.should.have.property("progressTotal", 200);
                done();
            });
        });
    });

    describe('Upload.', function () {
	it('Should return correct url', function (done) {
            s3Service.upload("not exist file", "not exist size", function (err, url) {
                should.exists(err);
                done();
            });
        });
    });
});

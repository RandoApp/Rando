var should = require("should");
var sinon = require("sinon");
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

    describe('Get Client.', function () {
	it('Should return correct client with correct bucket', function (done) {
            var smallClient = s3Service.getClient("small");
            smallClient.knox.options.bucket.should.be.eql(config.s3.bucket.img.small);
            var mediumClient = s3Service.getClient("medium");
            mediumClient.knox.options.bucket.should.be.eql(config.s3.bucket.img.medium);
            var largeCleint = s3Service.getClient("large");
            largeCleint.knox.options.bucket.should.be.eql(config.s3.bucket.img.large);
            done();
        });

	it('Unknown client type should return large client', function (done) {
            var largeCleint = s3Service.getClient("some strange client that not exists");
            largeCleint.knox.options.bucket.should.be.eql(config.s3.bucket.img.large);
            done();
        });
    });

    describe('Upload.', function () {
	it('Should return correct client with correct bucket', function (done) {
        });
    });
});

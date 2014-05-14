var s3 = require("s3");
var config = require("config");
var logger = require("../log/logger");
var async = require("async");

var headers = {
    'Content-Type': 'image/jpg',
    'x-amz-acl': 'public-read',
    "Cache-Control": "public, max-age=" + config.app.cacheControl
};

var imageSmallClient = s3.createClient({
    key: config.s3.key,
    secret: config.s3.secret,
    bucket: config.s3.bucket.img.small
});

var imageMediumClient = s3.createClient({
    key: config.s3.key,
    secret: config.s3.secret,
    bucket: config.s3.bucket.img.medium
});

var imageLargeClient = s3.createClient({
    key: config.s3.key,
    secret: config.s3.secret,
    bucket: config.s3.bucket.img.large
});

module.exports = {
    upload: function (file, size, callback) {
	var client = this.getClient(size);
	var uploader = client.upload(file, this.getS3FileName(file), headers);

	uploader.on('progress', function (amountDone, amountTotal) {
	    logger.debug("[s3Service.upload.progress] amountDone: ", amountDone, " amountTotal: ", amountTotal); 
	}).on('end', function (url) {
	    logger.data("[s3Service.upload.end] File ", file, " uploaded. Url: ", url);
	    callback(null, url);
	}).on('error', function (err) {
	    logger.error("[s3Service.upload.error] Can't upload file: ", file, " because: ", err);
	    callback(err);
	});
    },
    getClient: function (size) {
	if (size == "small") {
	    return imageSmallClient;
	} else if (size == "medium") {
	    return imageMediumClient;
	} 

	return imageLargeClient;
    },
    getS3FileName: function (file) {
	return /[\w\d]+\.jpg$/.exec(file);
    }
};

var s3 = require("s3");
var config = require("config");
var logger = require("../log/logger");
var async = require("async");

var clinet = s3.createClient({
    maxAsyncS3: Infinity,
    s3RetryCount: 3,
    s3RetryDelay: 1000,
    s3Options: {
        accessKeyId: config.s3.key,
        secretAccessKey: config.s3.secret,
    }
});

module.exports = {
    upload: function (file, size, callback) {
	var uploader = clinet.uploadFile(this.buildParams(file, size));
        this.processUploader(uploader, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, this.buildUrl(file, size));
        });
    },
    processUploader: function (uploader, callback) {
	uploader.on('progress', function () {
	    logger.debug("[s3Service.upload.progress] amount: ", uploader.progressAmount, " total: ", uploader.progressTotal); 
	}).on('end', function (data) {
	    logger.data("[s3Service.upload.end] File uploaded. data: ", data);
	    callback();
	}).on('error', function (err) {
	    logger.error("[s3Service.upload.error] Can't upload file, because: ", err);
	    callback(err);
	});
    },
    buildParams: function (file, size) {
        return {
            localFile: file,
            s3Params: {
                Bucket: config.s3.bucket.img[size],
                Key: this.getS3FileName(file),
                ContentType: "image/jpg",
                CacheControl: "public, max-age=" + config.app.cacheControl,
                ACL: "public-read",
                StorageClass: "STANDARD"
            }
        };
    },
    buildUrl: function (file, size) {
        return config.s3.url + config.s3.bucket.img[size] + "/" + file;
    },
    getS3FileName: function (file) {
        var s3File = /[\w\d]+\.jpg$/.exec(file);
        if (Array.isArray(s3File)) {
            return s3File[0];
        }
	return s3File;
    }
};

var s3 = require("s3");
var config = require("config");
var logger = require("../log/logger");
var async = require("async");
var Errors = require("../error/errors");

var client = s3.createClient({
  maxAsyncS3: Infinity,
  s3RetryCount: 3,
  s3RetryDelay: 1000,
  s3Options: {
    accessKeyId: config.s3.key,
    secretAccessKey: config.s3.secret,
  }
});

module.exports = {
  upload (files, size, callback) {
    this.uploadToBucket(files[size], config.s3.bucket.img[size], callback);
  },
  uploadToShare (file, callback) {
    this.uploadToBucket(file, config.s3.bucket.img.large, callback);
  },
  uploadToBucket (file, bucket, callback) {
    logger.trace("[s3Service.uploadToBucket]"); 
    var params = this.buildParams(file, bucket);
    logger.trace("[s3Service.upload]", " Params generated: ", params); 
    var uploader = client.uploadFile(params);
    this.processUploader(uploader, function (err) {
      if (err) {
        return callback(Errors.System(err));
      }
      var url = s3.getPublicUrlHttp(params.s3Params.Bucket, params.s3Params.Key, true);
      return callback(null, url);
    });
  },
  download (path, callback) {
    var localRandoPath = config.app.shorter.folder + path;
    var downloader = client.downloadFile({
      localFile: localRandoPath,
      s3Params: {
        Bucket: config.s3.bucket.img.large,
        Key: path
      }
    });

    downloader.on("error", function(err) {
      logger.error("[s3Service.download]", "Cannot download, because err:", err);
      callback(err);
    });

    downloader.on("progress", function() {
      logger.trace("[s3Service.download]", "progress of download");
    });

    downloader.on("end", function() {
      logger.debug("[s3Service.download]", "Downloaded");
      callback(null, localRandoPath);
    });
  },
  processUploader (uploader, callback) {
    logger.trace("[s3Service.processUploader]"); 
    uploader.on("progress", function () {
      logger.debug("[s3Service.upload.progress] amount: ", uploader.progressAmount, " total: ", uploader.progressTotal); 
    }).on("end", function (data) {
      logger.data("[s3Service.upload.end] File uploaded. data: ", data);
      callback();
    }).on("error", function (err) {
      logger.error("[s3Service.upload.error] Can't upload file, because: ", err);
      callback(Errors.System(err));
    });
  },
  buildParams (file, bucket) {
    logger.trace("[s3Service.buildParams]"); 
    return {
      localFile: config.app.static.folder.name + file,
      s3Params: {
        Bucket: bucket,
        Key: this.getS3FileName(file),
        ContentType: "image/" + this.getImageType(file),
        CacheControl: "public, max-age=" + config.app.cacheControl,
        ACL: "public-read",
        StorageClass: "STANDARD"
      }
    };
  },
  getImageType (file) {
    return this.getImageParams(file).type;
  },
  getS3FileName (file) {
    return this.getImageParams(file).name;
  },
  getImageParams (file) {
    var fileNameAndType = {
      name: "",
      type: ""
    };

    var fileParams = /[\w\d]+\.(jpg|png|gif)$/.exec(file);
    if (Array.isArray(fileParams) && fileParams[0] && fileParams[1]) {
      fileNameAndType.name = fileParams[0];
      fileNameAndType.type = fileParams[1];
    }
    return fileNameAndType;
  }
};

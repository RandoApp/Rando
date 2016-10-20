var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var util = require("../util/util");
var mv = require("mv");
var Errors = require("../error/errors");
var gm = require("gm").subClass({ imageMagick: true });

module.exports =  {
  resize: function (size, imagePaths, randoId, imagePath, callback) {
   logger.data("[imageService.resize] Try resize image to size: ", size, " image path: ", imagePath, " imagePaths: ", imagePaths, " randoId: ", randoId);

   logger.debug("[imageService.resize.resize] gm.resize.quality.write");
   var originImagePath = config.app.static.folder.name + imagePaths.origin;
   var sizeImagePath = config.app.static.folder.name + imagePaths[size];
   logger.debug("[imageService.resize.resize] Try resize image with options: originalFoodPath: ", originImagePath, "destination image: ", sizeImagePath);
   gm(originImagePath).resize(config.app.img.size[size]).quality(config.app.img.quality).write(sizeImagePath, function (err) {
      if (err) {
        logger.error("[imageService.resize.resize] gm.resize.quality.write done with error: ", err);
        callback(err);
        return;
      } 

      logger.debug("[imageService.resize.resize] gm.resize.quality.write done successfully");
      callback();
    });
  },
  drawRando (originalRandoPath, drawedRandoPath, callback) {
    gm(originalRandoPath).composite(config.app.shorter.maskPath).write(drawedRandoPath, function (err) {
      if (err) {
        logger.error("[imageService.drawRando] gm.drawRando.write done with error: ", err);
        callback(err);
        return;
      } 

      logger.debug("[imageService.drawRando] gm.drawRando.write done successfully");
      callback(null, drawedRandoPath);
    });
  }
};

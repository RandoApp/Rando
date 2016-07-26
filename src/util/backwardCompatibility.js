var logger = require("../log/logger");
var config = require("config");

module.exports = {
    //compatible with for 1.0.14 version and less.
    makeUserBackwardCompaitble: function (user, callback) {
      logger.debug("[backwardCompatibility.makeUserBackwardCompatible, ", user.email, "]");
      user.randos = this.makeRandosArraySync(user.out, user.in);
      callback(null, user);
    },
    makeRandosArraySync: function (outs, ins) {
      var randos = [];
      for (var i = 0; i < outs.length; i++) {
        var randoPair = {
          user: outs[i],
        };

        if (ins[i]) {
          randoPair.stranger = ins[i];
        } else {
          randoPair.stranger = {
            email: "",
            location: {
              latitude: 0,
              longitude: 0
            },
            randoId: "",
            imageURL: "",
            imageSizeURL: {
              small: "",
              medium: "",
              large: ""
            },
            mapURL: "",
            mapSizeURL: {
              small: "",
              medium: "",
              large: ""
            },
            creation: 0
          };
        }

        if (randoPair.stranger.delete) {
          randoJSON.stranger.imageURL = config.app.reportedImageStub; 
          randoJSON.stranger.imageSizeURL.small = config.app.reportedImageStub; 
          randoJSON.stranger.imageSizeURL.medium = config.app.reportedImageStub; 
          randoJSON.stranger.imageSizeURL.large = config.app.reportedImageStub; 

          randoJSON.stranger.mapURL = config.app.reportedImageStub; 
          randoJSON.stranger.mapSizeURL.small = config.app.reportedImageStub; 
          randoJSON.stranger.mapSizeURL.medium = config.app.reportedImageStub; 
          randoJSON.stranger.mapSizeURL.large = config.app.reportedImageStub; 
        }

        randoPair.user.report = 0;
        randoPair.stranger.report = 0;

        randoPair.user.bonAppetit = 0;
        randoPair.stranger.bonAppetit = 0;

        randos.push(randoPair);
      }
      return randos;
    },
    tokenConverter: function (req, res, next) {
      if (req.params.token && !req.headers.authorization){
        req.headers.authorization = "Token "+ req.params.token;
      }
      req.query.token = req.params.token;
      next();
    }
  };


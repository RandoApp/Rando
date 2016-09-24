var mongoose = require("mongoose");
var winston = require("winston");
var start = Date.now();

var OldUser = mongoose.model("user", new mongoose.Schema({
    email: {type: String, unique: true, lowercase: true},
    authToken: String,
    facebookId: String,
    googleId: String,
    anonymousId: String,
    password: String,
    ban: Number,
    ip: String,
    randos: [{
   user: {
       email: String,
       randoId: String,
       creation: Number,
       location: {
      latitude: Number,
      longitude: Number
       },
       imageURL: String,
       imageSizeURL: {
      small: String,
      medium: String,
      large: String
       },
       mapURL: String,
       mapSizeURL: {
      small: String,
      medium: String,
      large: String
       },
       report: Number,
            delete: Number
   },
   stranger: {
       email: String,
       randoId: String,
       creation: Number,
       location: {
      latitude: Number,
      longitude: Number
       },
       imageURL: String,
       imageSizeURL: {
      small: String,
      medium: String,
      large: String
       },
       mapURL: String,
       mapSizeURL: {
      small: String,
      medium: String,
      large: String
       },
       report: Number,
            delete: Number
   }
    }] 
}));


var NewUser = mongoose.model("newUser", new mongoose.Schema({
  email: {type: String, unique: true, lowercase: true},
  authToken: String,
  facebookId: String,
  googleId: String,
  anonymousId: String,
  password: String,
  ban: Number,
  ip: String,
  firebaseInstanceIds: [{
    instanceId: String,
    active: Number,
    createdDate: Number,
    lastUsedDate: Number
  }],
  in: [{
    email: String,
    randoId: String,
    strangerRandoId: String,
    creation: Number,
    ip: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    imageURL: String,
    imageSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    mapURL: String,
    mapSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    strangerMapURL: String,
    strangerMapSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    rating: Number,
    delete: Number
  }],
  out: [{
    email: String,
    randoId: String,
    strangerRandoId: String,
    creation: Number,
    ip: String,
    location: {
      latitude: Number,
      longitude: Number
    },
    imageURL: String,
    imageSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    mapURL: String,
    mapSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    strangerMapURL: String,
    strangerMapSizeURL: {
      small: String,
      medium: String,
      large: String
    },
    rating: Number,
    delete: Number
  }]
}));

var userSrv = {
  saveNewUser (user, callback) {
    winston.info("DB.User: Create user: ", user.email);
    new NewUser(user).save(function (err) {
      if (err) {
        winston.warn("DB.User: Can't create user with email: ", user.email, " because: ", err.message);
      }

      if (callback) {
        callback(err);
      }
    });
  },
  getOldUserByEmail (email, callback) {
    winston.info("DB.User: Get by email: ", email);
    OldUser.findOne({email}, callback);
  },
  forAll (processor, closer) {
    var stream = OldUser.find().lean().stream();
    stream.on("data", function (doc) {
      stream.pause();
      processor(doc, function () {
        stream.resume();
      });
    }).on("error", function (err) {
      winston.log(">>>> error: ", err);
    }).on("close", function () {
      winston.log(">>>> close");
      closer();
    });
  },
  processUser (user, callback) {
   var newUser = {
      email: user.email,
      authToken: user.authToken,
      facebookId: user.facebookId,
      googleId: user.googleId,
      anonymousId: user.anonymousId,
      password: user.password,
      ban: user.ban,
      ip: user.ip,
      firebaseInstanceIds: [],
      out: [],
      in: []
   };

   for (var i = 0; i < user.randos.length; i++) {
      winston.log("Process pair[" + i + "/" + user.randos.length + "]:", user.randos[i]);
      if (!user.randos[i]) {
        continue;
      }

      var userRando = user.randos[i].user;
      var strangerRando = user.randos[i].stranger;
      if (userRando && userRando.randoId) {
         if (strangerRando && strangerRando.randoId) {
            userRando.strangerRandoId = strangerRando.randoId;
            userRando.strangerMapURL = strangerRando.mapURL;
            userRando.strangerMapSizeURL = strangerRando.mapSizeURL;
            delete userRando._id;
         }

         newUser.out.push(userRando);
      }

      if (strangerRando && strangerRando.randoId) {
         delete strangerRando._id;
         newUser.in.push(strangerRando);
      }
   }
   return newUser;
  }
};

module.exports = {
  run (callback) {
    userSrv.forAll(function (oldUser, done) {
       winston.log("user: ", oldUser);
       var newUser = userSrv.processUser(oldUser);
       userSrv.saveNewUser(newUser, function (err) {
          if (err) {
             winston.log("ERROR!!!!!!!: ", err);
          } else {
             winston.log("User updated");
          }
      done();
       });
    }, function () {
       var end = Date.now();
        var timeSpent = (end-start) / 1000;
        winston.log("===> Migration finish at " + new Date(), " Time spent:", timeSpent, "sec");
        callback();
    });
  }
};

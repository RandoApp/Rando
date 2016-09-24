var mongoose = require("mongoose");
var async = require("async");
var winston = require("winston");
var config = require("config");
var start = Date.now()

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
  saveNewUser: function (user, callback) {
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
  getOldUserByEmail: function (email, callback) {
    winston.info("DB.User: Get by email: ", email);
    OldUser.findOne({email: email}, callback);
  },
  forAll: function (processor, closer) {
   var stream = OldUser.find().lean().stream();
   stream.on('data', function (doc) {
	stream.pause();
      processor(doc, function () {
		stream.resume();
	});
   }).on('error', function (err) {
      console.log(">>>> error");
   }).on('close', function () {
      console.log(">>>> close");
      closer();
   });
  }
};

var dbSrv = {
   connect: function (mongoURL) {
    mongoose.connect(mongoURL);
    var db = mongoose.connection;

    db.on("error", function (e) {
      winston.error("Monodb connection error: " + e);
    });

    db.on("open", function () {
      winston.info("Connection to mongodb established");
    });
    return db;
  },
  disconnect: function () {
    mongoose.disconnect();
    winston.info("Connections to mongodb closed");
  },
};

dbSrv.connect("mongodb://localhost/rando");

userSrv.forAll(function (oldUser, done) {
   console.log("user: ", oldUser);
   newUser = processUser(oldUser);
   userSrv.saveNewUser(newUser, function (err) {
      if (err) {
         console.log("ERROR!!!!!!!: ", err);
      } else {
         console.log("User updated")
      }
	done();
   });
}, function () {
   var end = Date.now();
    var timeSpent = (end-start) / 1000;
    console.log("===> Migration finish at " + new Date(), " Time spent:", timeSpent, "sec");
});

function processUser (user, callback) {
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
      console.log("Process pair[" + i + "/" + user.randos.length + "]:", user.randos[i]);
      if (!user.randos[i]) continue;

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


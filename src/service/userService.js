var logger = require("../log/logger");
var db = require("randoDB");
var async = require("async");
var config = require("config");
var crypto = require("crypto");
var Errors = require("../error/errors");
var backwardCompatibility = require("../util/backwardCompatibility");
var passwordUtil = require("../util/password");

module.exports = {
  addOrUpdateFirebaseInstanceId (user, firebaseInstanceId, callback) {
  if (user && firebaseInstanceId) {
    if (!user.firebaseInstanceIds){
      user.firebaseInstanceIds = [];
    }
      async.detect(user.firebaseInstanceIds, (instanceIdTest, done) => {
      done(null, instanceIdTest.instanceId === firebaseInstanceId);
    }, (err, instanceIdFound) => {
      if (err){
        logger.log(err);
        done("err finding instanceId");
      }
      if(instanceIdFound){
        logger.debug("[userService.addOrUpdateFirebaseInstanceId] ","Activating firebaseInstanceId: ", firebaseInstanceId, " for user: ", user.email);
        instanceIdFound.lastUsedDate = Date.now();
        instanceIdFound.active = true;
      } else {
        user.firebaseInstanceIds.push( { instanceId: firebaseInstanceId, active: true, createdDate: Date.now(), lastUsedDate: Date.now() } );
        logger.debug("[userService.addOrUpdateFirebaseInstanceId] ","Adding new firebaseInstanceId: ", firebaseInstanceId, " for user: ", user.email);
      }
      if (callback) {
        callback(null, user);
      }
  });
  } else {
    if (callback){
        callback("user and firebaseInstanceId should be present", user);
      }
  }
  return;
},

deactivateFirebaseInstanceId (user, firebaseInstanceId, callback) {
  if (user && firebaseInstanceId) {
    if (!user.firebaseInstanceIds){
      user.firebaseInstanceIds = [];
    }
    async.detect(user.firebaseInstanceIds, (instanceIdTest,done) => {
      done(null, instanceIdTest.instanceId === firebaseInstanceId);
    }, (err, instanceIdFound) => {
      if (err){
        logger.log(err);
        done("err finding instanceId");
      }
      if(instanceIdFound){
        logger.debug("[userService.deactivateFirebaseInstanceId] ", "Deactivating firebaseInstanceId: ", firebaseInstanceId, " for user: ", user.email);
        instanceIdFound.lastUsedDate = Date.now();
        instanceIdFound.active = false;
      } else {
        user.firebaseInstanceIds.push( { instanceId: firebaseInstanceId, active: false, createdDate: Date.now(), lastUsedDate: Date.now() } );
        logger.debug("[userService.deactivateFirebaseInstanceId] ", "Deactivating never used firebaseInstanceId: ", firebaseInstanceId, " for user: ", user.email);
      }
      if (callback){
        callback(null, user);
      }
  });
  } else {
    if (callback){
        callback("user and firebaseInstanceId should be present", user);
      }
  }
},

  destroyAuthToken (user, firebaseInstanceId, callback) {
    user.authToken = "";
    this.deactivateFirebaseInstanceId(user, firebaseInstanceId);
    db.user.update(user);
    callback(null, {command: "logout", result: "done"});
  },

  buildRandoSync (rando) {
    return {
      creation: rando.creation,
      randoId: rando.randoId,
      imageURL: rando.imageURL,
      imageSizeURL: rando.imageSizeURL,
      mapURL: rando.mapURL,
      mapSizeURL: rando.mapSizeURL
    };
  },

  getUser (user, callback) {
    logger.debug("[userService.getUser, ", user.email, "] Try get user");
    var self = this;
    var userJSON = {
      email: user.email,
      in: [],
      out: []
    };

    async.parallel({
      buildOut (parallelDone) {
        async.each(user.out, function (rando, done) {
          userJSON.out.push( self.buildRandoSync(rando) );
          done();
        }, parallelDone);
      },
      buildIn (parallelDone) {
        async.each(user.in, function (rando, done) {
          userJSON.in.push( self.buildRandoSync(rando) );
          done();
        }, parallelDone);
      }
    }, function (err) {
      if (err) {
        logger.warn("[userService.getUser ] Error when each randos in parallel for : ", user);
        callback(Errors.System(err));
        return;
      }

      backwardCompatibility.makeUserBackwardCompaitble(userJSON, function (err, compatibleUserJSON) {
        if (err) {
          logger.warn("[userService.getUser] Error when make user backward compaitble");
          callback(Errors.System(err));
          return;
        }
        callback(null, compatibleUserJSON);
      });
    });
  },

  findOrCreateByLoginAndPassword (email, password, ip, firebaseInstanceId, callback) {
    var self = this;
    logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] Try find or create for user with email: ", email);

    if (!email || !/.+@.+\..+/.test(email) || !password) {
      logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Email or password is incorrect. Return error");
      callback(Errors.LoginAndPasswordIncorrectArgs());
      return;
    }

    db.user.getByEmail(email, function(err, user) {
      if (err) {
        logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't db.user.getByEmail, because: ", err);
        callback(Errors.System(err));
        return;
      }
      if (user) {
        logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] User exist.");
        if (passwordUtil.isPasswordCorrect(password, user)) {
          user.authToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
          user.ip = ip;
          self.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {
          if (err && firebaseInstanceId) {
            logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] error setting firebaseInstanceId");
            callback(Errors.System(err));
            return;
         }
          db.user.update(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't update user with new authToken, because: ", err);
              callback(Errors.System(err));
              return;
            }
            callback(null, {token: user.authToken});
          });
        });
        } else {
          logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] user: ", email, " type incorrect password");
          callback(Errors.LoginAndPasswordIncorrectArgs());
        }
      } else {
        logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] user not exist. Try create him");
        var newUser = {
          authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
          email,
          password: passwordUtil.generateHashForPassword(email, password),
          ip,
          firebaseInstanceIds: []
        };
        self.addOrUpdateFirebaseInstanceId(newUser, firebaseInstanceId, function (err, user) {
         if (err && firebaseInstanceId) {
          logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "]error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }

        logger.data("[userService.findOrCreateByLoginAndPassword, ", email, "] Try create user in db.");
        db.user.create(user, function (err) {
          if (err) {
            logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't create user, because: ", err);
            return;
          }

          logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] User created.");
          callback(null, {token: newUser.authToken});
        });
      });
      }
    });
},

findOrCreateAnonymous (id, ip, firebaseInstanceId, callback) {
  var self = this;
  if (!id) {
    callback(Errors.IncorrectAnonymousId());
    return;
  }

  var email =  id + "@" + config.app.anonymousEmailPosftix;
  db.user.getByEmail(email, function(err, user) {
    if (err) {
      callback(Errors.System(err));
      return;
    }

    if (user) {
      logger.warn("[userService.findOrCreateAnonymous, ", email, "] User already exist");
      user.authToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
      user.ip = ip;
      self.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {
         if (err && firebaseInstanceId) {
          logger.info("[userService.findOrCreateAnonymous, ", email, "] error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
      db.user.update(user, function (err) {
        if (err) {
          logger.warn("[userService.findOrCreateAnonymous, ", email, "] Can't update user with new authToken, because: ", err);
          callback(Errors.System(err));
          return;
        }
        logger.debug("[userService.findOrCreateAnonymous, ", email, "] User authToken updated in db: ", user.authToken);
        callback(null, {token: user.authToken});
      });
    });
    } else {
      logger.debug("[userService.findOrCreateAnonymous, ", email, " User not exist. Try create him");
      var newUser = {
        authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
        anonymousId: id,
        email,
        ip,
        firebaseInstanceIds: []
      };
      self.addOrUpdateFirebaseInstanceId(newUser, firebaseInstanceId, function (err, user) {
         if (err && firebaseInstanceId) {
          logger.info("[userService.findOrCreateAnonymous, ", email, "]error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
      db.user.create(user, function (err) {
        if (err) {
          logger.warn("[userService.findOrCreateAnonymous, ", newUser.email, "] Can't create user because: ", err);
          callback(Errors.System(err));
          return;
        }
        logger.data("[userService.findOrCreateAnonymous, ", newUser.email, "] Anonymous user created.");
        callback(null, {token: newUser.authToken});
      });
    });
    }
  });
},

verifyFacebookAndFindOrCreateUser (id, email, token, ip, firebaseInstanceId, callback) {
  logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Start");

  var self = this;
  require("https").get({
    hostname: config.app.fb.host,
    port: config.app.fb.port,
    path: "/" + id + "?fields=id,email&access_token=" + token
  }, function(resp) {
    resp.on("data", function(chunk) {
      var json = JSON.parse(chunk.toString("utf8"));
      logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Recive json: ", json);
      if (json.email === email) {
        logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Emails is equals");
        self.findOrCreateByFBData({email, id, ip, firebaseInstanceId}, callback);
      } else {
        logger.debug("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Emails is not equals. Return incorrect args");
        callback(Errors.FBIncorrectArgs());
      }
    }).on("error", function(e){
      logger.warn("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Error in communication with Facebook: ", e);
      callback(Errors.FacebookError());
    });
  });
},

verifyGoogleAndFindOrCreateUser (email, familyName, token, ip, firebaseInstanceId, callback) {
  logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Start");

  var self = this;
  var googleJson = "";

  require("https").get({
    hostname: config.app.google.host,
    port: config.app.google.port,
    path: config.app.google.path + token
  }, function(resp) {
    resp.on("data", function (chunk) {
      googleJson += chunk.toString("utf8");
    }).on("end", function (chunk) {
      var json;
      try {
        json = JSON.parse(googleJson);
      } catch (e) {
        logger.warn("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Bad JSON: ", e.message);
        callback(Errors.GoogleError());
        return;
      }
      logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Recive json: ", json);
      if (json.family_name = familyName) {
        logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] family names is equals");
        self.findOrCreateByGoogleData(json.id, email, ip, firebaseInstanceId, callback);
      } else {
        logger.debug("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] family names is not eql. Return incorrect args.");
        callback(Errors.GoogleIncorrectArgs());
      }
    }).on("error", function (e) {
      logger.warn("[userService.verifyGoogleAndFindOrCreateUser, ", email, "] Error in communication with Google: ", e);
      callback(Errors.GoogleError());
    });
  });
},

findOrCreateByFBData (data, callback) {
  var self = this;
  logger.data("[userService.findOrCreateByFBData, ", data, "] Try find or create.");

  if (!data || !data.email) {
    logger.data("[userService.findOrCreateByFBData, ", data, "] Data or data.email is incorrect. Return error.");
    callback(Errors.FBIncorrectArgs());
    return;
  }

  db.user.getByEmail(data.email, function (err, user) {
    if (err) {
      logger.warn("[userService.findOrCreateByFBData, ", data.email, "] Can't get user by email, because: ", err);
      callback(Errors.System(err));
      return;
    }
    if (user) {
      logger.warn("[userService.findOrCreateByFBData, ", user.email, "] User ", data.email, " exist");
      user.authToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
      user.ip = data.ip;
      self.addOrUpdateFirebaseInstanceId(user, data.firebaseInstanceId, function (err, user) {
         if (err && data.firebaseInstanceId) {
          logger.info("[userService.findOrCreateByFBData, ", user.email, "]error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
        db.user.update(user, function (err) {
          if (err) {
            logger.warn("[userService.findOrCreateByFBData, ", email, "] Can't update user with new authToken, because: ", err);
            callback(Errors.System(err));
            return;
          }
          callback(null, {token: user.authToken});
        });
      });
    } else {
      logger.debug("[userService.findOrCreateByFBData, ", data.email, " User not exist. Try create him");

      var newUser = {
        authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"), 
        facebookId: data.id,
        email: data.email,
        ip: data.ip,
        firebaseInstanceIds : []
      };
      self.addOrUpdateFirebaseInstanceId(newUser, data.firebaseInstanceId, function (err, user) {
         if (err && data.firebaseInstanceId) {
          logger.info("[userService.findOrCreateByFBData, ", user.email, "]error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
      db.user.create(user, function (err) {
        if (err) {
          logger.warn("[userService.findOrCreateByFBData, ", newUser.email, "] Can't create user because: ", err);
          callback(Errors.System(err));
          return;
        }
        logger.data("[userService.findOrCreateByFBData, ", newUser.email, "] User created: ", newUser);
        callback(null, {token: newUser.authToken});
      });
    });
    }
  });
},

findOrCreateByGoogleData (id, email, ip, firebaseInstanceId, callback) {
  var self = this;
  logger.data("[userService.findOrCreateByGoogleData, ", email, "] Try find or create.");

  if (!email || !id) {
    logger.data("[userService.findOrCreateByGoogleData, ", email, "] Data or data.email is incorrect. Return error.");
    callback(Errors.GoogleIncorrectArgs());
    return;
  }

  db.user.getByEmail(email, function (err, user) {
    if (err) {
      logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't get user by email, because: ", err);
      callback(Errors.System(err));
      return;
    }

    if (user) {
      logger.warn("[userService.findOrCreateByGoogleData, ", user.email, "] User ",email, " exist");
      user.authToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
      user.googleId = id;
      user.ip = ip;
      self.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {
         if (err && firebaseInstanceId) {
          logger.info("[userService.findOrCreateByGoogleData, ", user.email, "] error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
      db.user.update(user, function (err) {
        if (err) {
          logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't update user with new authToken, because: ", err);
          callback(Errors.System(err));
          return;
        }
        callback(null, {token: user.authToken});
      });
      });
    } else {
      logger.debug("[userService.findOrCreateByGoogleData, ", email, " User not exist. Try create him");

      var newUser = {
        authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"), 
        googleId: id, 
        email: email,
        ip: ip
      }
      self.addOrUpdateFirebaseInstanceId(newUser, firebaseInstanceId, function (err, user) {
         if (err && firebaseInstanceId) {
          logger.info("[userService.findOrCreateByGoogleData, ", user.email, "] error setting firebaseInstanceId");
          callback(Errors.System(err));
          return;
         }
      db.user.create(user, function (err) {
        if (err) {
          logger.warn("[userService.findOrCreateByGoogleData, ", newUser.email, "] Can't create user because: ", err);
          callback(Errors.System(err));
          return;
        }

        logger.data("[userService.findOrCreateByGoogleData, ", email, "] User created: ", newUser);
        callback(null, {token: newUser.authToken});
      });
    });
    }
  });
}
};

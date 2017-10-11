var logger = require("../log/logger");
var db = require("randoDB");
var async = require("async");
var config = require("config");
var crypto = require("crypto");
var Errors = require("../error/errors");
var backwardCompatibility = require("../util/backwardCompatibility");
var passwordUtil = require("../util/password");
var util = require("../util/util");
var GoogleAuth = require("google-auth-library");
var auth = new GoogleAuth;
var client = new auth.OAuth2(config.app.auth.googleClientId, "", "");

module.exports = {
  //Deprecated. See firebaseService
  addOrUpdateFirebaseInstanceId (user, firebaseInstanceId, callback) {
    if (!user) {
      return callback("user should be present", user);
    }
    //This if is needed to support old clients
    //TODO: Remove when all clients will be on 1.0.15+
    if (!firebaseInstanceId) {
      return callback(null, user);
    }

    if (!user.firebaseInstanceIds) {
      user.firebaseInstanceIds = [];
    }

    async.detect(user.firebaseInstanceIds, (instanceIdTest, done) => {
      done(null, instanceIdTest.instanceId === firebaseInstanceId);
    }, (err, instanceIdFound) => {
      if (err) {
        logger.log("[userService.addOrUpdateFirebaseInstanceId]", err);
        return callback(Errors.System(err));
      }

      if (instanceIdFound) {
        logger.debug("[userService.addOrUpdateFirebaseInstanceId]", "Activating firebaseInstanceId:", firebaseInstanceId, "for user:", user.email);
        instanceIdFound.lastUsedDate = Date.now();
        instanceIdFound.active = true;
      } else {
        logger.debug("[userService.addOrUpdateFirebaseInstanceId] ","Adding new firebaseInstanceId:", firebaseInstanceId, " for user:", user.email);
        var now = Date.now();
        user.firebaseInstanceIds.push({
          instanceId: firebaseInstanceId,
          active: true,
          createdDate: now,
          lastUsedDate: now
        });
      }
      return callback(null, user);
    });
  },
  destroyAuthToken (email, callback) {
    async.parallel([
      function destroyAuthToken (done) {
        db.user.updateUserMetaByEmail(email, {authToken: ""}, done);
      },
      function destroyFirebaseIds (done) {
        db.user.updateActiveForAllFirabaseIdsByEmail(email, false, done);
      }
    ], function (err) {
      if (err) {
        logger.info("[userService.destroyAuthToken, ", email, "] error deactivating firebaseInstanceIds");
        return callback(Errors.System(err));
      }
      return callback(null, {command: "logout", result: "done"});
    });
  },
  getUser (email, callback) {
    logger.debug("[userService.getUser, ", email, "] Try get user");
    var self = this;
    var user = {
      email: email,
      in: [],
      out: []
    };

    db.user.getAllLightInAndOutRandosByEmail(email, function (err, randos) {
      if (err) {
        logger.warn("[userService.getUser] Error when make getAllLightInAndOutRandosByEmail call to db, because: ", err);
        return callback(Errors.System(err));
      }

      user.in = randos.in.filter(rando => {return rando.delete !== 1 && rando.report !== 1 && rando.randoId});
      user.out = randos.out.filter(rando => {return rando.delete !== 1 && rando.report !== 1 && rando.randoId});

      user.in.forEach(rando => {
        delete rando.delete;
        delete rando.report;
      });

      user.out.forEach(rando => {
        rando.mapURL = rando.strangerMapURL ? rando.strangerMapURL : "";
        rando.mapSizeURL = util.getSizeableOrEmpty(rando.strangerMapSizeURL);
        delete rando.strangerMapURL;
        delete rando.strangerMapSizeURL;
        delete rando.delete;
        delete rando.report;
        rando.detected = Array.isArray(rando.tags) ? rando.tags.map(tag => {
          for (var detectedTag in config.app.detectedTagMap) {
            if (config.app.detectedTagMap[detectedTag].indexOf(tag) !== -1) {
              return detectedTag;
            }
          }
        }).filter(tag => tag) : [];
        delete rando.tags;
      });


      return callback(null, user);
    });
  },
  getBackwardCompatibleUser (email, callback) {
    this.getUser(email, function (err, user) {
      if (err) {
        return callback(err);
      }

      backwardCompatibility.makeUserBackwardCompaitble(user, function (err, compatibleUserJSON) {
        if (err) {
          logger.warn("[userService.getUser] Error when make user backward compaitble");
          return callback(Errors.System(err));

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
      return callback(Errors.LoginAndPasswordIncorrectArgs());
    }

    db.user.getByEmail(email, function(err, user) {
      if (err) {
        logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't db.user.getByEmail, because: ", err);
        return callback(Errors.System(err));
      }
      if (user) {
        logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] User exist.");
        if (passwordUtil.isPasswordCorrect(password, user, config.app.secret)) {
          const userAuthToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
          const userIp = ip;
          self.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {
          if (err) {
            logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }
          db.user.updateUserMetaByEmail(user.email, { authToken: userAuthToken, ip: userIp, firebaseInstanceIds: user.firebaseInstanceIds }, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't update user with new authToken, because: ", err);
              return callback(Errors.System(err));
            }
            return callback(null, {token: userAuthToken});
          });
        });
        } else {
          logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "] user: ", email, " type incorrect password");
          return callback(Errors.LoginAndPasswordIncorrectArgs());
        }
      } else {
        logger.debug("[userService.findOrCreateByLoginAndPassword, ", email, "] user not exist. Try create him");
        var newUser = {
          authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
          email,
          password: passwordUtil.generateHashForPassword(email, password, config.app.secret),
          ip,
          firebaseInstanceIds: []
        };
        self.addOrUpdateFirebaseInstanceId(newUser, firebaseInstanceId, function (err, user) {
          if (err) {
            logger.info("[userService.findOrCreateByLoginAndPassword, ", email, "]error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }

          logger.data("[userService.findOrCreateByLoginAndPassword, ", email, "] Try create user in db.");
          db.user.create(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] Can't create user, because: ", err);
              return callback(Errors.System(err));
            }
            logger.warn("[userService.findOrCreateByLoginAndPassword, ", email, "] User created.");
            return callback(null, {token: newUser.authToken});
          });
        });
      }
    });
  },

  findOrCreateAnonymous (id, ip, firebaseInstanceId, callback) {
    var self = this;
    if (!id) {
      return callback(Errors.IncorrectAnonymousId());
    }

    var email =  id + "@" + config.app.anonymousEmailPosftix;
    db.user.getByEmail(email, function(err, user) {
      if (err) {
        return callback(Errors.System(err));
      }

      if (user) {
        logger.warn("[userService.findOrCreateAnonymous, ", email, "] User already exist");
        user.authToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
        user.ip = ip;
        self.addOrUpdateFirebaseInstanceId(user, firebaseInstanceId, function (err, user) {
          if (err) {
            logger.info("[userService.findOrCreateAnonymous, ", email, "] error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }
          db.user.update(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateAnonymous, ", email, "] Can't update user with new authToken, because: ", err);
              return callback(Errors.System(err));
            }
            logger.debug("[userService.findOrCreateAnonymous, ", email, "] User authToken updated in db: ", user.authToken);
            return callback(null, {token: user.authToken});
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
          if (err) {
            logger.info("[userService.findOrCreateAnonymous, ", email, "]error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }
          db.user.create(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateAnonymous, ", newUser.email, "] Can't create user because: ", err);
              return callback(Errors.System(err));
            }
            logger.data("[userService.findOrCreateAnonymous, ", newUser.email, "] Anonymous user created.");
            return callback(null, {token: newUser.authToken});
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
          return callback(Errors.FBIncorrectArgs());
        }
      }).on("error", function(e){
        logger.warn("[userService.verifyFacebookAndFindOrCreateUser, ", id, " - ", email, "] Error in communication with Facebook: ", e);
        return callback(Errors.FacebookError());
      });
    });
  },

  verifyGoogleAndFindOrCreateUser (email, token, ip, firebaseInstanceId, callback) {
    if (!email || !token) {
      return callback(Errors.GoogleIncorrectArgs());
    }
    var self = this;
    logger.info("verifyGoogleAndFindOrCreateUser with token length: ", token.length);
    client.verifyIdToken(
      token,
      config.app.auth.googleClientIds,
      (e, data) => {
        if (e) {
          logger.warn("verifyGoogleAndFindOrCreateUser google response with err: ", e);
          return callback(e);
        }
        var payload = data.getPayload();
        var userId = payload["sub"];
        var userEmail = payload["email"];
        logger.info("verifyGoogleAndFindOrCreateUser got userId:", userId);
        logger.info("verifyGoogleAndFindOrCreateUser got userEmail:", userEmail);
        if (email === userEmail) {
          logger.info("verifyGoogleAndFindOrCreateUser successful login: ", userEmail);
          return self.findOrCreateByGoogleData(userId, userEmail, ip, firebaseInstanceId, callback);
        } else {
          logger.warn("verifyGoogleAndFindOrCreateUser Emails are different. requested: ", email, " But google return: ", userEmail);
          return callback(Errors.GoogleError());
        }
      }
    );
  },

  verifyGoogleAndFindOrCreateUserDeprecated (email, familyName, token, ip, firebaseInstanceId, callback) {
    logger.debug("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] Start");

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
          logger.warn("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] Bad JSON: ", e.message);
          return callback(Errors.GoogleError());
        }
        logger.debug("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] Recive json: ", json);
        if (json.family_name === familyName) {
          logger.debug("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] family names is equals");
          self.findOrCreateByGoogleData(json.id, email, ip, firebaseInstanceId, callback);
        } else {
          logger.debug("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] family names is not eql. Return incorrect args.");
          return callback(Errors.GoogleIncorrectArgs());
        }
      }).on("error", function (e) {
        logger.warn("[userService.verifyGoogleAndFindOrCreateUserDeprecated, ", email, "] Error in communication with Google: ", e);
        return callback(Errors.GoogleError());
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
          if (err) {
            logger.info("[userService.findOrCreateByGoogleData, ", user.email, "] error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }
          db.user.update(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateByGoogleData, ", email, "] Can't update user with new authToken, because: ", err);
              return callback(Errors.System(err));
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
          if (err) {
            logger.info("[userService.findOrCreateByGoogleData, ", user.email, "] error setting firebaseInstanceId");
            return callback(Errors.System(err));
          }
          db.user.create(user, function (err) {
            if (err) {
              logger.warn("[userService.findOrCreateByGoogleData, ", newUser.email, "] Can't create user because: ", err);
              return callback(Errors.System(err));
            }

            logger.data("[userService.findOrCreateByGoogleData, ", email, "] User created: ", newUser);
            callback(null, {token: newUser.authToken});
          });
        });
      }
    });
  }
};

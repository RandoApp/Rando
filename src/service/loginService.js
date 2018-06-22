const logger = require("../log/logger");
const db = require("@rando4.me/db");
const async = require("async");
const config = require("config");
const crypto = require("crypto");
const Errors = require("../error/errors");
const passwordUtil = require("../util/password");
const GoogleAuth = require("google-auth-library");
const auth = new GoogleAuth;
const client = new auth.OAuth2(config.app.auth.googleClientId, "", "");
const firebaseService = require("./firebaseService");

module.exports = {
  destroyAuthToken(email, callback) {
    async.parallel([
      function destroyAuthToken(done) {
        db.user.updateUserMetaByEmail(email, {
          authToken: ""
        }, done);
      },
      function destroyFirebaseIds(done) {
        db.user.updateActiveForAllFirabaseIdsByEmail(email, false, done);
      }
    ], function(err) {
      if (err) {
        logger.info("[loginService.destroyAuthToken, ", email, "] error deactivating firebaseInstanceIds");
        return callback(Errors.System(err));
      }
      return callback(null, {
        command: "logout",
        result: "done"
      });
    });
  },
  loginRandoUser(email, password, ip, firebaseInstanceId, callback) {
    logger.debug("[loginService.findOrCreateByLoginAndPassword, ", email, "] Try find or create for user with email: ", email);

    if (!email || !/.+@.+\..+/.test(email) || !password) {
      logger.warn("[loginService.findOrCreateByLoginAndPassword, ", email, "] Email or password is incorrect. Return error");
      return callback(Errors.LoginAndPasswordIncorrectArgs());
    }

    db.user.getLightUserByEmail(email, (err, user) => {
      if (err) {
        logger.warn("[loginService.findOrCreateByLoginAndPassword, ", email, "] Can't db.user.getLightUserByEmail, because: ", err);
        return callback(Errors.System(err));
      }
      if (user) {
        return this.login(user, email, password, ip, firebaseInstanceId, null, callback);
      } else {
        const newUser = {
          authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
          email,
          password: passwordUtil.generateHashForPassword(email, password, config.app.secret),
          ip,
          firebaseInstanceIds: []
        };
        return this.signup(newUser, email, firebaseInstanceId, callback);
      }
    });
  },

  login(user, email, password, ip, firebaseInstanceId, googleId, callback) {
    logger.debug("[loginService.findOrCreateByLoginAndPassword, ", email, "] User exist.");
    if (password && !passwordUtil.isPasswordCorrect(password, user, config.app.secret)) {
      logger.info("[loginService.findOrCreateByLoginAndPassword, ", email, "] user: ", email, " type incorrect password");
      return callback(Errors.LoginAndPasswordIncorrectArgs());
    }

    const userAuthToken = crypto.randomBytes(config.app.tokenLength).toString("hex");
    async.waterfall([
      (done) => {
        firebaseService.addOrUpdateFirebaseInstanceIdOnUser(user, firebaseInstanceId, done);
      },
      (userWithFirebaseIds, done) => {
        const userMeta = {
          authToken: userAuthToken,
          ip,
          firebaseInstanceIds: userWithFirebaseIds.firebaseInstanceIds
        };

        if (googleId) {
          userMeta.googleId = googleId;
        }

        db.user.updateUserMetaByEmail(email, userMeta, done);
      }
    ], (err) => {
      if (err) {
        return callback(Errors.System(err));
      } else {
        return callback(null, {
          token: userAuthToken
        });
      }
    });
  },

  signup(newUser, email, firebaseInstanceId, callback) {
    logger.debug("[loginService.findOrCreateByLoginAndPassword, ", email, "] user not exist. Try create him");
    async.waterfall([
      (done) => {
        firebaseService.addOrUpdateFirebaseInstanceIdOnUser(newUser, firebaseInstanceId, done);
      },
      (newUserWithFirebaseIds, done) => {
        db.user.create(newUserWithFirebaseIds, done);
      }
    ], (err) => {
      if (err) {
        logger.warn("[loginService.findOrCreateByLoginAndPassword, ", email, "] Can't create user, because: ", err);
        return callback(Errors.System(err));
      } else {
        return callback(null, {
          token: newUser.authToken
        });
      }
    });
  },

  loginAnonymous(id, ip, firebaseInstanceId, callback) {
    if (!id) {
      return callback(Errors.IncorrectAnonymousId());
    }

    const email = id + "@" + config.app.anonymousEmailPosftix;
    db.user.getLightUserByEmail(email, (err, user) => {
      if (err) {
        return callback(Errors.System(err));
      }

      if (user) {
        return this.login(user, email, null, ip, firebaseInstanceId, null, callback);
      } else {
        var newUser = {
          authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
          anonymousId: id,
          email,
          ip,
          firebaseInstanceIds: []
        };
        return this.signup(newUser, email, firebaseInstanceId, callback);
      }
    });
  },

  loginGoogleUser(email, token, ip, firebaseInstanceId, callback) {
    if (!email || !token) {
      return callback(Errors.GoogleIncorrectArgs());
    }

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
          return this.findOrCreateByGoogleData(userId, userEmail, ip, firebaseInstanceId, callback);
        } else {
          logger.warn("verifyGoogleAndFindOrCreateUser Emails are different. requested: ", email, " But google return: ", userEmail);
          return callback(Errors.GoogleError());
        }
      }
    );
  },

  findOrCreateByGoogleData(id, email, ip, firebaseInstanceId, callback) {
    logger.data("[loginService.findOrCreateByGoogleData, ", email, "] Try find or create.");

    if (!email || !id) {
      logger.data("[loginService.findOrCreateByGoogleData, ", email, "] Data or data.email is incorrect. Return error.");
      callback(Errors.GoogleIncorrectArgs());
      return;
    }

    db.user.getLightUserByEmail(email, (err, user) => {
      if (err) {
        logger.warn("[loginService.findOrCreateByGoogleData, ", email, "] Can't get user by email, because: ", err);
        return callback(Errors.System(err));
      }

      if (user) {
        return this.login(user, email, null, ip, firebaseInstanceId, user.googleId, callback);
      } else {
        const newUser = {
          authToken: crypto.randomBytes(config.app.tokenLength).toString("hex"),
          email,
          ip,
          googleId: id
        };
        return this.signup(newUser, email, firebaseInstanceId, callback);
      }
    });
  }
};

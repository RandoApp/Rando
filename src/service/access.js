var Errors = require("../error/errors");
var db = require("randoDB");
var logger = require("../log/logger");
var config = require("config");

function checkAccess (req, res, next) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  var authHeader = req.headers.authorization || 
  logger.debug("[access.checkAccess] start. Authorization header: ", authHeader, " ip: ", ip);
  if (!authHeader) {
    logger.debug("[access.checkAccess] Authorization header. Send Unauthorized");
    sendUnauthorized(res);
    return;
  }

  var authHeaderSplit = authHeader.split(' ');

  if (authHeaderSplit.length !==2 ||  authHeaderSplit[0]!=="Token"){
    logger.debug("[access.checkAccess] Bad to token format. Send Unauthorized");
    sendUnauthorized(res);
    return;
  }

  var token = authHeaderSplit[1];
  db.user.getByToken(token, function (err, user) {
    if (err) {
      logger.warn("[access.checkAccess] Error when db.user.getByToken: ", err);
      var response = Errors.toResponse(Errors.System(err));
      res.status(response.status).send(response);
      return;
    } else if (!user) {
      logger.warn("[access.checkAccess] User with token: ", token, " not exists. Send Unauthorized");
      sendUnauthorized(res);
      return;
    }

    var firebaseInstanceId = req.get("FirebaseInstanceId");
    logger.debug("[access.checkAccess] Log in: ", user.email , " <== ", token," FirebaseInstanceId: ", firebaseInstanceId);
    updateIpAndFirebaseInstanceId(user, ip, firebaseInstanceId);
    db.user.update(user);
    req.user = user;
    next();
  });
}

function checkSpam (req, res, next) {
  var user = req.user;
  if (user.ban && Date.now() <= user.ban) {
    logger.warn("[access.checkSpam, ", user.email, "] Banned user send request. Ban to: ", user.ban);
    sendForbidden(res, user.ban);
    return;
  }

  var randos = user.out;
  if (randos.length > config.app.limit.images) {
    randos.sort(function (rando1, rando2) {
      return rando2.creation - rando1.creation;
    });

    var timeBetwenImagesLimit = Date.now() - randos[config.app.limit.images - 1].creation;
    logger.debug("[access.checkSpam, ", user.email, "] Now: ", Date.now(), " last in limit image creation: ", randos[config.app.limit.images - 1].creation, " Time between Images limit: ", timeBetwenImagesLimit);

    if (timeBetwenImagesLimit <= config.app.limit.time) {
      user.ban = Date.now() + config.app.limit.ban;
      db.user.update(user, function (err) {
        if (err) {
          logger.warn("[access.checkSpam, ", user.email, "] Can't update user for ban, because: ", err);
        }

        logger.debug("[access.checkSpam, ", user.email, "] Spam found. Return error.");
        sendForbidden(res, user.ban);
        return;
      });
      return;
    }
  }

  logger.debug("[access.checkSpam, ", user.email, "] User ok. Go next.");
  next();
}

function sendUnauthorized (res) {
  var response = Errors.toResponse(Errors.Unauthorized());
  res.status(response.status).send(response);
}

function sendForbidden(res, ban) {
  var response = Errors.toResponse(Errors.Forbidden(ban));
  res.status(response.status).send(response);
}

function updateIpAndFirebaseInstanceId (user, ip, firebaseInstanceId) {
  if (!user.ip || (user.ip && user.ip != ip)) {
    logger.debug("[access.updateIp] Update to new ip[", ip ,"] for user: ", user.email);
    user.ip = ip;
  }
  var firebaseInstanceIdSet = false;
  if (firebaseInstanceId) {
    for (var i = 0; i < user.firebaseInstanceIds.length; i++) {
        if (user.firebaseInstanceIds[i].instanceId === firebaseInstanceId) {
            user.firebaseInstanceIds[i].lastUsedDate = Date.now();
            user.firebaseInstanceIds[i].active = true;
            firebaseInstanceIdSet = true;
        }
    }
    if (!firebaseInstanceIdSet){
      user.firebaseInstanceIds.push( { instanceId: firebaseInstanceId, active: true, createdDate: Date.now(), lastUsedDate: Date.now() } );
      firebaseInstanceIdSet = true;
    }
  }
  return;
}

module.exports = {
  byToken: checkAccess,
  noSpam: checkSpam
};

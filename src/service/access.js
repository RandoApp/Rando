var Errors = require("../error/errors");
var db = require("randoDB");
var logger = require("../log/logger");


function checkAccess (req, res, next) {
    var ip = req.ip;
    var token = req.query.token || req.path.match(/.{42}$/g)[0];
    logger.debug("[access.checkAccess] start. token: ", token, " ip:", ip);
    if (!token) {
        logger.debug("[access.checkAccess] No Token. Send Unauthorized");
        sendUnauthorized(res);
        return;
    }

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

        logger.debug("[access.checkAccess] Log in: ", user.email , " <== ", token);
        updateIp(user, ip);
        req.user = user;
        next();
    });
}

function sendUnauthorized (res) {
    var response = Errors.toResponse(Errors.Unauthorized());
    res.status(response.status).send(response);
}

function updateIp (user, ip) {
    if (!user.ip || (user.ip && user.ip != ip)) {
        logger.debug("[access.updateIp] Update to new ip[", ip ,"] for user: ", user.email);
        user.ip = ip;
        db.user.update(user);
        return;
    }
}

module.exports = checkAccess; 

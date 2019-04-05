const db = require("@rando4.me/db");
const async = require("async");
const config = require("config");
const logger = require("../../log/logger");
const Errors = require("../../error/errors");
const pushNotificationService = require("../pushNotificationService");
const randoService = require("../randoService");

module.exports = {
  rate (user, randoId, rating, callback) {
    logger.debug("[commentService.rate, ", user.email, "] Start rate rando:", randoId);
    rating = parseInt(rating);
    if (isNaN(rating) || rating < 1 || rating > 3) {
      return callback(Errors.IncorrectArgs());
    }

    async.waterfall([
      function fetchStranger (done) {
        db.user.getLightUserMetaByOutRandoId(randoId, done);
      },
      function checkThatUserDoesNotRatedHimself (stranger, done) {
        if (stranger.email === user.email) {
          return done(Errors.IncorrectArgs());
        }
        return done(null, stranger);
      },
      function updateData (stranger, done) {
        async.parallel({
          rateRandoForUserIn (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForUserIn, ", user.email, "for user: ", stranger.email, "rateRando: ", randoId);
            db.user.updateInRandoProperties(user.email, randoId, {rating}, parallelDone);
          },
          rateRandoForStrangerOut (parallelDone) {
            logger.trace("[commentService.rate.rateRandoForStrangerOut, ", stranger.email, "by user: ", user.email, "rateRando: ", randoId);
            db.user.updateOutRandoProperties(stranger.email, randoId, {rating}, parallelDone);
          }
        }, err => {
          done(err, stranger);
        });
      },
      function fetchRatedStrangerRando (stranger, done) {
        logger.trace("[commentService.rate.fetchRatedStrangerRando]", "Fetch rando by randoId:", randoId);
        db.user.getLightRandoByRandoId(randoId, (err, data) => {
          let ratedRando = null;
          if (data && data.out[0]) {
            ratedRando = data.out[0];
          }
          logger.trace("[commentService.rate.fetchRatedStrangerRando]", "ratedRando:", ratedRando);
          return done(err, stranger, ratedRando);
        });
      },
      function notifyStrangerAboutRatingUpdate (stranger, ratedRando, done) {
        logger.trace("[commentService.rate.notifyStrangerAboutRatingUpdate]", "Send rated notification to", stranger.email, "with rando:", ratedRando);
        if (ratedRando.delete) {
          logger.trace("[commentService.rate.notifyStrangerAboutRatingUpdate]", "Stranger rando has been deleted. Do not send notification");
          return done();
        }

        var message = {
          notificationType: "rated",
          rando: randoService.buildRandoSync(ratedRando)
        };
        pushNotificationService.sendMessageToAllActiveUserDevices(message, stranger, done);
      }
    ], err => {
        logger.trace("[commentService.rate, ", user.email, "]", "Processing db updated results for rando: ", randoId);
        if (err) {
          if (err.rando) {
            logger.debug("[commentService.rate, ", user.email, "]; waterfall stopped because error", err.rando.message);
            return callback(err);
          } else {
            logger.debug("[commentService.rate, ", user.email, "] We have error in DB when updating user with rando: ", randoId, " Error: ", err.message);
            return callback(Errors.System(err));
          }
        }
        logger.debug("[commentService.rate, ", user.email, "] User successfully updated with reported rando: ", randoId);
        return callback(null, {command: "rate", result: "done"});
    });
  }
};

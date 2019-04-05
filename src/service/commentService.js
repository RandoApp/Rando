const reportService = require("./comment/reportService");
const deleteService = require("./comment/deleteService");
const rateService = require("./comment/rateService");

module.exports = {
  delete(user, randoId, callback) {
    deleteService.delete(user, randoId, callback);
  },
  report(goodUser, reporedRandoId, callback) {
    reportService.report(goodUser, reporedRandoId, callback);
  },
  rate(user, randoId, rating, callback) {
    rateService.rate(user, randoId, rating, callback);
  }
};

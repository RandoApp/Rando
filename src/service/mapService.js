var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var Errors = require("../error/errors");
var fs = require("fs");
var crypto = require("crypto");

module.exports =  {
  cities: null,
  locationToMapURLSync: function (latitude, longitude) {
    logger.debug("[mapService.locationToMapURLSync] latitude: ", latitude, " longitude: ", longitude);
    if (!this.cities) this.loadCitiesJson();

    var city = this.findNearestCity(latitude, longitude);
    logger.debug("[mapService.locationToMapURLSync] Found nearest city: ", city);
    var tileName = this.generateTileName(city);
    logger.debug("[mapService.locationToMapURLSync] generate tileName: ", tileName);
    var mapSizeURL = {
      small: config.app.url + config.app.static.folder.map + config.app.img.folder.small + tileName + "." + config.app.img.ext,
      medium: config.app.url + config.app.static.folder.map + config.app.img.folder.medium + tileName + "." + config.app.img.ext,
      large: config.app.url + config.app.static.folder.map + config.app.img.folder.large + tileName + "." + config.app.img.ext,
    }
    logger.debug("[mapService.locationToMapURLSync] mapSizeURL: ", mapSizeURL);
    return mapSizeURL;
  },
  findNearestCity: function (latitude, longitude) {
    var minDistance = Number.MAX_VALUE;
    var city = this.cities[0];
    for (var i = 0; i < this.cities.length; i++) {
      var distance = Math.sqrt(Math.pow(latitude - this.cities[i].latitude, 2) + Math.pow(longitude - this.cities[i].longitude, 2));
      if (distance < minDistance) {
        city = this.cities[i];
        minDistance = distance;
      }
    }
    return city;
  },
  generateTileName: function (city) {
    return crypto.createHash("md5").update(city.name + city.longitude + city.latitude).digest("hex");
  },
  loadCitiesJson: function () {
    if (!this.cities) {
      this.cities = JSON.parse(fs.readFileSync(config.app.citiesJson));
      logger.debug("[mapService.loadCitiesJson] cities loaded");
    }
  }
}


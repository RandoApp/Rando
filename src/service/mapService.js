var logger = require("../log/logger");
var config = require("config");
var async = require("async");
var Errors = require("../error/errors");
var fs = require("fs");
var crypto = require("crypto");

module.exports =  {
    citiesJson: null,
    locationToMapUrlSync: function (latitude, longitude) {
		if (!this.citiesJson) this.loadCitiesJson();

		var city = this.findNearestCity(latitude, longitude);
		var tileName = this.generateTileName(city);
		return config.app.url + config.app.static.folder.map + tileName + "." + config.app.static.file.ext;
	},
	findNearestCity: function (latitude, longitude) {
		var minDistance = Number.MAX_VALUE;
		var city = this.citiesJson[0];
		for (var i = 0; i < this.citiesJson.length; i++) {
			var distance = Math.sqrt(Math.abs(Math.pow(latitude - this.citiesJson[i].latitude, 2) + Math.pow(longitude - this.citiesJson[i].longitude, 2)));
			if (distance < minDistance) {
				city = this.citiesJson[i];
				minDistance = distance;
			}
		}
		return city;
	},
	generateTileName: function (city) {
		return crypto.createHash("md5").update(city.name + city.longitude + city.latitude).digest("hex");
	},
	loadCitiesJson: function () {
		if (!this.citiesJson) {
			this.citiesJson = JSON.parse(fs.readFileSync(config.app.citiesJson));
		}
	}
}


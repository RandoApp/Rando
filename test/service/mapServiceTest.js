var config = require("config");
var should = require("should");
var sinon = require("sinon");
var mapService = require("../../src/service/mapService");

describe('Map service.', function () {
    describe('Find nearest city.', function () {
		it('Normal classic test', function (done) {
			var Lida = {name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817};

			mapService.cities = [
				{name: "Minsk", latitude: 10, longitude: 10},
				{name: "Panevezys", latitude: 55.740020161, longitude: 24.3700264066},
				Lida,
				{name: "Aracaju", latitude: -10.9000207328, longitude: -37.1199670833}];

			var city = mapService.findNearestCity(53.7, 25.3);
			city.should.be.eql(Lida);
			done();
		});
		it('Exactly same location', function (done) {
			var Lida = {name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817};

			mapService.cities = [
				{name: "Minsk", latitude: 10, longitude: 10},
				{name: "Panevezys", latitude: 55.740020161, longitude: 24.3700264066},
				Lida,
				{name: "Aracaju", latitude: -10.9000207328, longitude: -37.1199670833}];

			var city = mapService.findNearestCity(Lida.latitude, Lida.longitude);
			city.should.be.eql(Lida);
			done();
		});
		it('First', function (done) {
			var Lida = {name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817};

			mapService.cities = [
				Lida,
				{name: "Minsk", latitude: 10, longitude: 10},
				{name: "Panevezys", latitude: 55.740020161, longitude: 24.3700264066},
				{name: "Aracaju", latitude: -10.9000207328, longitude: -37.1199670833}];

			var city = mapService.findNearestCity(53.7, 25.3);
			city.should.be.eql(Lida);
			done();
		});
		it('Last', function (done) {
			var Lida = {name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817};

			mapService.cities = [
				{name: "Minsk", latitude: 10, longitude: 10},
				{name: "Panevezys", latitude: 55.740020161, longitude: 24.3700264066},
				{name: "Aracaju", latitude: -10.9000207328, longitude: -37.1199670833},
				Lida];

			var city = mapService.findNearestCity(53.7, 25.3);
			city.should.be.eql(Lida);
			done();
		});
		it('Equal locations', function (done) {
			var Lida = {name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817};
			var Lida2 = {name: "Lida2", latitude: 53.8884794302, longitude: 25.2846475817};

			mapService.cities = [
				{name: "Minsk", latitude: 10, longitude: 10},
				Lida,
				{name: "Panevezys", latitude: 55.740020161, longitude: 24.3700264066},
				Lida2,
				{name: "Aracaju", latitude: -10.9000207328, longitude: -37.1199670833}];

			var city = mapService.findNearestCity(53.7, 25.3);
			city.should.be.eql(Lida);
			done();
		});
	});

    describe('Generate tile name.', function () {
		it('Should find user and rando', function (done) {
			var city = {name: "Minsk", latitude: 53.8999774364, longitude: 27.5666271553};
			var tileName = mapService.generateTileName(city);
			tileName.should.be.eql("c425b557fcbde6cd337150d22811837d");
			done();
		});
	});

    describe('Location to map url sync', function () {
		it('Should find user and rando', function (done) {
			var configUrl = config.app.url;
			var configMap = config.app.static.folder.map;
			var configExt = config.app.static.file.ext;
			config.app.url = "http://rando4.me";
			config.app.static.folder.map = "/map/";

			mapService.cities = [{name: "Minsk", latitude: 53.8999774364, longitude: 27.5666271553}];

			var mapSizeUrl = mapService.locationToMapURLSync(53, 27);
			mapSizeUrl.small.should.be.eql("http://rando4.me/map/small/c425b557fcbde6cd337150d22811837d.jpg");
			mapSizeUrl.medium.should.be.eql("http://rando4.me/map/medium/c425b557fcbde6cd337150d22811837d.jpg");
			mapSizeUrl.large.should.be.eql("http://rando4.me/map/large/c425b557fcbde6cd337150d22811837d.jpg");

			config.app.url = configUrl;
			config.app.static.folder.map = configMap;
			done();
		});
	});
});


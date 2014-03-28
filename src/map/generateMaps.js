var fs = require("fs");
var crypto = require("crypto");
var async = require("async");
var mapnik = require("mapnik");
var mercator = new (require("sphericalmercator"));

//How many cities should be processed in the same time:
var TILE_RENDER_LIMIT = 30;


var TEMPLATE_STYLESHEET = "foodex.xml";
var MARKER_FILE = "markerStar.svg";
//KEYS in foodex.xml file for replacing:
var CITY_NAME_KEY = "CITY_NAMEASCII";
var MARKER_KEY = "MARKER_URL";


var TILES_DIR = "/tmp/foodex-map-data/tiles/";
var STYLESHEET_TMP_DIR = "/tmp/foodex-map-data/";
var SHP_POPULATED_PLACES_FILE = "10m_cultural/ne_10m_populated_places_simple.shp";


//This files should exists before this script run:
var PLACES_FILE = "/tmp/foodex-map-data/places.json";
var SHP_FILES_DIR = "/tmp/foodex-map-data/";
var shpFiles = [
	"ne_10m_rivers_europe.shp",
	"ne_10m_lakes.shp",
	"ne_10m_rivers_north_america.shp",
	"ne_10m_lakes_europe.shp",
	"ne_10m_lakes_north_america.shp",
	"10m_cultural/ne_10m_admin_0_countries.shp",
	"10m_cultural/ne_10m_roads.shp",
	"10m_cultural/ne_10m_admin_1_states_provinces_lines_shp.shp",
	SHP_POPULATED_PLACES_FILE];

//This file will be generete by this script:
var CITIES_FILE = "/tmp/foodex-map-data/cities.json";
var CITIES_SOURCE_FILE = "cities.json";

var TILE_IMAGE_SIZE = 1024;
var MAP_BBOX_SIZE = 3.3; //in degrees


function checkData () {
	for (var i = 0; i < shpFiles.length; i++) {
		checkShpFile(SHP_FILES_DIR + shpFiles[i]);
	}
	checkPlacesJSON();
}

function checkShpFile(shpFile) {
	fs.exists(shpFile, function (exists) {
		if (!exists) {
			console.error("File " + shpFile + " not found.\n\nPlease, prepare map data before starting script:\n" +
				"mkdir /tmp/foodex-map-data\n" +
				"cd /tmp/foodex-map-data\n" + 
				"wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/10m_cultural.zip\n" +
				"wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/10m_physical.zip\n" +
				"unzip 10m_cultural.zip\n" +
				"unzip 10m_physical.zip\n" +
				"");
			process.exit(1);
		}
	});
}

function checkPlacesJSON() {
	fs.exists(PLACES_FILE, function (exists) {
		if (!exists) {
			console.error("File " + PLACES_FILE + " not found.\n\nPlease, generate places file with ogr2ogr util from  osci-libs/gdal package:\n" +
				"ogr2ogr -t_srs EPSG:4326 -f geoJSON " + PLACES_FILE + " " + SHP_FILES_DIR +  SHP_POPULATED_PLACES_FILE + "\n" +
				"Read more about gdal(Geospatial Data Abstraction Library) here: www.gdal.orga");
			process.exit(1);
		}
	});
}

function mkTilesdir(done) {
	fs.mkdir(TILES_DIR, function (err) {
		done(null);
	});
}

function cp(source, target, callback) {
	var sourceStream = fs.createReadStream(source);
	sourceStream.on("error", function (err) {
		callback(err);
	});

	var targetStream = fs.createWriteStream(target);
	targetStream.on("error", function (err) {
		callback(err);
	});

	targetStream.on("close", function (ex) {
		callback(null);
	});

	sourceStream.pipe(targetStream);
}

function copyStyleFiles(done) {
	cp(MARKER_FILE, STYLESHEET_TMP_DIR + MARKER_FILE, done);
}

function generateCitiesJSON(done) {
	async.waterfall([
		function (callback) {
			fs.readFile(PLACES_FILE, function (err, data) {
				if (err) {
					console.error("Can not read " + PLACES_FILE + " because: " + err);
					callback(err);
					return;
				}
				callback(null, JSON.parse(data));
			});
		},
		function (places, callback) {
			var cities = [];
			for (var i = 0; i < places.features.length; i++) {
				cities.push({
					"name": places.features[i].properties.nameascii,
					"latitude": places.features[i].properties.latitude,
					"longitude": places.features[i].properties.longitude
				});
			}
			callback(null, cities);
		}, 
		function (cities, callback) {
			fs.writeFile(CITIES_FILE, JSON.stringify(cities), function (err) {
				if (err) {
					console.error("Can not write citeis file: " + CITIES_FILE + " because: " + err);
					callback(err);
					return;
				}
				cp(CITIES_FILE, CITIES_SOURCE_FILE, function (err) {
					if (err) {
						callback(err);
						return;
					}

					callback(null, cities);
				});
			});
		}
	], function (err, cities) {
		if (err) {
			console.error("Cities json generation occured with error: " + err + "  TERMINATE script. Please, fix error and restart script again");
			process.exit(1);
		}
		done(null, cities);
	});
}

function loadStylesheetTemplate(cities, done) {
	fs.readFile(TEMPLATE_STYLESHEET, function (err, data) {
		if (err) {
			console.error("Can not read stylesheet " + TEMPLATE_STYLESHEET + " , because: " + err);
			done(err);
			return;
		}
		
		var stylesheetTemplate = String(data);
		for (var i = 0; i < shpFiles.length; i++) {
			stylesheetTemplate = stylesheetTemplate.replace(new RegExp(shpFiles[i], "g"), SHP_FILES_DIR + shpFiles[i]);
		}

		stylesheetTemplate = stylesheetTemplate.replace(new RegExp(MARKER_KEY, "g"), MARKER_FILE);

		done(null, cities, stylesheetTemplate);
	});
}

function renderTiles(cities, templateStylesheet, done) {
	async.eachLimit(cities, TILE_RENDER_LIMIT, function (city, callback) {
		console.log(city.name);
		var tileName = crypto.createHash("md5").update(city.name + city.longitude + city.latitude).digest("hex");
		var cityStylesheet = templateStylesheet.replace(new RegExp(CITY_NAME_KEY, "g"), city.name.replace("'", "\\'"));
		var stylesheetFileName = STYLESHEET_TMP_DIR + tileName + ".xml";
		fs.writeFileSync(stylesheetFileName, cityStylesheet);
		renderTile(stylesheetFileName, tileName, city.longitude, city.latitude, callback);
	}, function (err) {
		if (err) {
			console.error("Cities processed with error: " + err); 
			done(err);
			return;
		}
		console.log("Cities successfully processed");
		done(null);
	});
}

function renderTile(stylesheet, tileName, longitude, latitude, done) {
	async.waterfall([
			function (callback) {
				mapnik.register_default_fonts();
				mapnik.register_default_input_plugins();

				var map = new mapnik.Map(TILE_IMAGE_SIZE, TILE_IMAGE_SIZE);
				map.load(stylesheet, function (err, map) {
					if (err) {
						console.log("Mapnik can not load stylesheet " +  stylesheet  + " , because: " + err);
						callback(err);
						return;
					}
					console.log("Mapnik loaded stylesheet: " + stylesheet);
					callback(null, map);
				});
			},
			function (map, callback) {
				var bbox = [];
				bbox = bbox.concat(mercator.forward([longitude - MAP_BBOX_SIZE, latitude + MAP_BBOX_SIZE]));
				bbox = bbox.concat(mercator.forward([longitude + MAP_BBOX_SIZE, latitude - MAP_BBOX_SIZE]));
				map.extent = bbox;

				var image = new mapnik.Image(TILE_IMAGE_SIZE, TILE_IMAGE_SIZE);
				map.render(image, function (err, img) {
					if (err) {
						console.log("Can not render image, because: " + err);
						callback(err);
						return;
					}
					callback(null, img);
				});
			},
			function (img, callback) {
				img.encode('png', function(err, buffer) {
					if (err) {
						console.log("Can not encode image, because: " + err);
						callback(err);
						return;
					}

					var tileFileName = TILES_DIR + tileName + ".png";
					fs.writeFile(tileFileName, buffer, function (err) {
						if (err) {
							console.log("Can not save tile " + tileName + " , because: " + err);
							callback(err);
							return;
						}
						console.log("Mapnik renderd tile to: " + tileFileName);
						callback(null);
					});
				});
			}
	], function (err) {
		if (err) {
			console.error("Render tile occurred with error: " + err);
			done(err);
			return;
		}

		console.log("Render tile successfully finished");
		done(null);
	});
}

function main() {
	checkData();

	async.waterfall([
		mkTilesdir,
		copyStyleFiles,
		generateCitiesJSON,
		loadStylesheetTemplate,
		renderTiles
	], function (err) {
		if (err) {
			console.error("Error in main: " + err);
			return;
		}
		console.log("Script finished successfully");
	});
}

main();


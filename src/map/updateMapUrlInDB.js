var config = require("config");
var async = require("async");
var mongodbConnection = require("../model/db").establishConnection();
var mapService = require("../service/mapService");
var userModel = require("../model/userModel");
var foodModel = require("../model/foodModel");

function updateUsersCollection(done) {
    userModel.getAll(function (err, users) {
	if (err) {
	    done(err);
	    return;
	}

	for (var i = 0; i < users.length; i++) {
	    updateUser(users[i]);
	}

	done();
    });
}

function updateFoodsCollection(done) {
    foodModel.getAll(function (err, foods) {
	if (err) {
	    done(err);
	    return;
	}

	if (!foods) {
	    console.log("No foods");
	    return;
	}

	for (var i = 0; i < foods.length; i++) {
	    if (updateFoodPart(foods[i])) {
		foodModel.update(foods[i]);
	    }
	}

	done();
    });
}

function updateUser(user) {
    var needUpdate = false;
    for (var i = 0; i < user.foods.length; i++) {
	if (updateFood(user.foods[i])) {
	    needUpdate = true;
	}
    }

    if (needUpdate) {
	userModel.update(user);
    }
}

function updateFood(food) {
    if (updateFoodPart(food.user) || updateFoodPart(food.stranger)) {
	return true;
    }
    return false;
}

function updateFoodPart(food) {
    if (food.location && food.location.latitude != 0 && food.location.longitude != 0 && food.mapUrl != config.app.mapStub) {
	food.mapUrl = mapService.locationToMapUrlSync(food.location.latitude, food.location.longitude);
	return true;
    }
    return false;
}

function exit () {
    require("mongoose").connection.close();
}

function main() {
    async.parallel([
	updateUsersCollection,
	updateFoodsCollection
    ], function (err) {
	if (err) {
	    console.error("ERROR: " + err);
	} else {
	    console.log("Script finished successfully");
	}
	exit();
    });
}

main();

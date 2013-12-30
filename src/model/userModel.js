var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var User = mongoose.model("user", new mongoose.Schema({
    email: String,
    facebookId: String,
    anonymousId: String,
    password: String,
    foods: [{
	user: {
	    user: String,
	    location: String,
	    foodId: String,
	    foodUrl: String,
	    creation: Number,
	    mapUrl: String,
	    report: Number,
	    bonAppetit: Number
	},
	stranger: {
	    user: String,
	    location: String,
	    foodId: String,
	    foodUrl: String,
	    mapUrl: String,
	    creation: Number,
	    report: Number,
	    bonAppetit: Number
	}
    }] 
}));

module.exports = {
    create: function (user, callback) {
	if (!user) {
	    logger.warn("[userModel.create] Hey, programmer! You forgot pass user arg to userModel.create! or passed user arg is undefined!");
	    return;
	}

	if (!user.email) {
	    logger.warn("[userModel.create] Hey, programmer! userModel.create must contains email value in arg object!");
	    return;
	}
	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("[userModel.create] Can't create user! Email: ", email, " because: ", err);
		    return;
		}

		logger.debug("[userModel.create] User created: ", user);
	    };
	}

	logger.data("[userModel.create] Create user: Email: ", user);

	var user = new User(user);
	user.save(callback);
    },
    update: function (user, callback) {
	logger.data("[userModel.update] Update user with  Email: ", user.email, ". New user: ", user);

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("[userModel.update] Can't update user with email: ", user.email, " because: ", err);
		    return;
		}

		logger.debug("[userModel.update] User updated. Email: ", user.email);
	    };
	}

	user.save(callback);
    },
    getByEmail: function (email, callback) {
	logger.data("[userModel.getByEmail] Try find user by email: ", email);
	User.findOne({email: email}, callback);
    },
    getById: function (id, callback) {
	logger.data("[userMode.getById] Try find user by id: ", id);
	User.findById(id, callback);
    }
};

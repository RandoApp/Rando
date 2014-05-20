var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var User = mongoose.model("user", new mongoose.Schema({
    email: String,
    authToken: String,
    facebookId: String,
    googleId: String,
    anonymousId: String,
    password: String,
    ban: Number,
    ip: String,
    randos: [{
	user: {
	    email: String,
	    location: {
		latitude: Number,
		longitude: Number
	    },
	    randoId: String,
	    imageURL: String,
	    imageSizeURL: {
		small: String,
		medium: String,
		large: String
	    },
	    creation: Number,
	    mapURL: String,
	    mapSizeURL: {
		small: String,
		medium: String,
		large: String
	    },
	    report: Number
	},
	stranger: {
	    email: String,
	    location: {
		latitude: Number,
		longitude: Number
	    },
	    randoId: String,
	    imageURL: String,
	    imageSizeURL: {
		small: String,
		medium: String,
		large: String
	    },
	    mapURL: String,
	    mapSizeURL: {
		small: String,
		medium: String,
		large: String
	    },
	    creation: Number,
	    report: Number
	}
    }] 
}));

module.exports = {
    create: function (user, callback) {
	if (!user) {
	    logger.warn("[userModel.create] Hey, programmer! You forgot pass user arg to userModel.create! or passed user arg is undefined!");
	    return;
	} else if (!user.email) {
	    logger.warn("[userModel.create] Hey, programmer! userModel.create must contains email value in arg object!");
	    return;
	}

	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("[userModel.create] Can't create user! Email: ", email, " because: ", err);
		    return;
		}

		logger.debug("[userModel.create] User created with email: ", user.email);
	    };
	}

	logger.data("[userModel.create] Create user: Email: ", user.email);

	var user = new User(user);
	user.save(callback);
    },
    update: function (user, callback) {
	logger.data("[userModel.update] Update user with  Email: ", user.email);

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
    },
    getByToken: function (token, callback) {
	logger.data("[userMode.getByToken] Try find user by authToken: ", token);
	User.findOne({authToken: token}, callback);
    },
    getAll: function (callback) {
	logger.data("[userMode.getAll]");
	User.find({}, callback);
    }
};

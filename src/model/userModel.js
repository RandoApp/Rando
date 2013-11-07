var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");

var User = mongoose.model("user", new mongoose.Schema({
    email: String,
    facebookId: String,
    password: String,
    foods: [{
	user: {
	    userId: String,
	    location: String,
	    foodId: String,
	    foodUrl: String,
	    creation: Date,
	    mapUrl: String,
	    bonAppetit: Boolean
	},
	stranger: {
	    strangerId: String,
	    location: String,
	    foodId: String,
	    foodUrl: String,
	    mapUrl: String,
	    report: Boolean,
	    bonAppetit: Boolean
	}
    }] 
}));

module.exports = {
    create: function (user, callback) {
	if (!user) {
	    logger.warn("Hey, programmer! You forgot pass user arg to userModel.create! or passed user arg is undefined!");
	    return;
	}

	if (!user.email) {
	    logger.warn("Hey, programmer! userModel.create must contains email value in arg object!");
	    return;
	}
	if (!callback) {
	    callback = function (err) {
		if (err) {
		    logger.warn("Can't create user! Email: ", email);
		    return;
		}

		logger.debug("User created: ", user);
	    };
	}

	logger.data("Create user: Email: ", user);

	var user = new User(user);
	user.save(callback);
    },
    update: function (user, callback) {
	if (user && user instanceof mongoose.Model) {
	    logger.data("Update user: Email: ", user.email, ". New user: ", user);

	    if (!callback) {
		callback = function (err) {
		    if (err) {
			logger.warn("Can't upadate user! Email: ", user.email);
			return;
		    }

		    logger.debug("User updated. Email: ", user.email);
		};
	    }

	    user.save(callback);
	}
    },
    getByEmail: function (email, callback) {
	logger.data("Try find user by email: ", email);
	User.findOne({email: email}, callback);
    },
    getById: function (id, callback) {
	logger.data("Try find user by id: ", id);
	User.findById(id, callback);
    }
};

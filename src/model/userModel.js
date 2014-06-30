var mongoose = require("mongoose");
var config = require("config");
var logger = require("../log/logger");
var async = require("async");

var User = mongoose.model("user", new mongoose.Schema({
    email: {type: String, unique: true, lowercase: true},
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
	    randoId: String,
	    creation: Number,
	    location: {
		latitude: Number,
		longitude: Number
	    },
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
	    report: Number
	},
	stranger: {
	    email: String,
	    randoId: String,
	    creation: Number,
	    location: {
		latitude: Number,
		longitude: Number
	    },
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
	    report: Number
	}
    }] 
}));

module.exports = {
    create: function (user, callback) {
	if (!user) {
            callback(new Error("User not exists"));
            return;
	}

	logger.data("[userModel.create] Create user: Email: ", user.email);

	var user = new User(user);
	user.save(function (err) {
            if (err) {
                logger.warn("[userModel.create] Can't create user! Email: ", user.email, " because: ", err);
            } else {
                logger.debug("[userModel.create] User created with email: ", user.email);
            }

            if (callback) {
                callback(err);
            }
        });
    },
    update: function (user, callback) {
	logger.data("[userModel.update] Update user with  Email: ", user.email);

	user.save(function (err) {
            if (err) {
                logger.warn("[userModel.update] Can't update user with email: ", user.email, " because: ", err);
            } else {
                logger.debug("[userModel.update] User updated. Email: ", user.email);
            }

            if (callback) {
                callback(err);
            }
        });
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
    },
    getEmailsAndRandosNumberArray: function (callback) {
        User.mapReduce({
            map: function () {
                emit(this.email, this.randos.length);
            },
            reduce: function (k, vals) {
                return vals;
            }
        }, function (err, emails) {
            async.each(emails, function (email, done) {
                email.email = email["_id"];
                email.randos = email.value;
                delete email["_id"];
                delete email.value;
                console.log(JSON.stringify(email));
                done();
            }, function (err) {
                callback(err, emails);
            });
        });
    }
};



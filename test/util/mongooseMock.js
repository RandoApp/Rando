var mongoose = require("mongoose");
var sinon = require("sinon");

module.exports = {
    stubSave: function (stub) {
	if (!stub) {
	    stub = function (callback) {
		callback(null);
	    };
	}
	sinon.stub(mongoose.Model.prototype, "save", stub);
	return this;
    },
    stubFindOne: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {email: email};
		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    stubFindOneWithNotFoundUser: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {email: email};
		callback(null, null);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    restore: function () {
	this.restoreSave();
	this.restoreFindOnce();
	return this;
    },

    restoreSave: function () {
	if (mongoose.Model.prototype.save.restore) {
	    mongoose.Model.prototype.save.restore();
	}
	return this;
    },
    restoreFindOnce: function () {
	if (mongoose.Model.findOne.restore) {
	    mongoose.Model.findOne.restore();
	}
	return this;
    }
};

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
		var user = {
		    email: email,
		    facebookId: "111111",
		    foods: [{
			user: {
			    email: email,
			    localtion: "1111.1111, 1111.1111",
			    food: "3333",
			    map: "4444",
			    bonAppetit: false
			},
			stranger: {
			    email: "stranger@mail.com",
			    localtion: "2222.2222, 2222.2222",
			    food: "3333",
			    map: "4444",
			    report: false,
			    bonAppetit: false
			}
		    }]
		};

		user.__proto__ = mongoose.model("user").prototype;

		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    stubFindOneWithEmptyUser: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {
		    email: email,
		    facebookId: "111111",
		    foods: []
		};
		user.__proto__ = mongoose.model("user").prototype;

		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    stubFindOneWithNotFoundUser: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		callback(null, null);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    stubFindByIdWithNotFoundUser: function (stub) {
	if (!stub) {
	    stub = function (id, callback) {
		callback(null, null);
	    };
	}
	sinon.stub(mongoose.Model, "findById", stub);
	return this;
    },
    stubFindById: function (stub) {
	if (!stub) {
	    stub = function (id, callback) {
		var user = {email: "user@mail.com"};
		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findById", stub);
	return this;
    },
    restore: function () {
	this.restoreSave();
	this.restoreFindOnce();
	this.restoreFindById();
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
    },
    restoreFindById: function () {
	if (mongoose.Model.findById.restore) {
	    mongoose.Model.findById.restore();
	}
	return this;
    }
};

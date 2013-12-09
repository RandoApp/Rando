var mongoose = require("mongoose");
var sinon = require("sinon");

module.exports = {
    stubSave: function (stub) {
	if (!stub) {
	    stub = function (callback) {
		callback(null, {
		    id: "524ea2324a590391a3e8b516",
		    email: "user@mail.com",
		    facebookId: "111111",
		    foods: []
		});
	    };
	}
	sinon.stub(mongoose.Model.prototype, "save", stub);
	return this;
    },
    stubFindOne: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {
		    id: "524ea2324a590391a3e8b516",
		    email: email,
		    facebookId: "111111",
		    foods: [{
			user: {
			    email: email,
			    userId: "524ea2324a590391a3e8b516",
			    localtion: "1111.1111, 1111.1111",
			    foodId: "3333",
			    foodUrl: "http://api.foodex.com/food/3333",
			    mapUrl: "http://api.foodex.com/food/4444",
			    bonAppetit: false
			},
			stranger: {
			    email: "stranger@mail.com",
			    localtion: "2222.2222, 2222.2222",
			    userId: "724ea2324a590391a3e8b516",
			    foodId: "3333",
			    foodUrl: "http://api.foodex.com/food/3333",
			    mapUrl: "http://api.foodex.com/map/444",
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
    stubFindUserWithNotPairedFood: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {
		    id: "524ea2324a590391a3e8b516",
		    email: email,
		    facebookId: "111111",
		    foods: [{
			user: {
			    email: email,
			    userId: "524ea2324a590391a3e8b516",
			    localtion: "1111.1111, 1111.1111",
			    foodId: "3333",
			    foodUrl: "http://api.foodex.com/food/3333",
			    creation: 123456789,
			    mapUrl: "http://api.foodex.com/food/4444",
			    bonAppetit: false
			},
			stranger: {
			    email: "",
			    localtion: "",
			    userId: "",
			    foodId: "",
			    foodUrl: "",
			    mapUrl: "",
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
		    id: "524ea2324a590391a3e8b516",
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
		var user = {
		    id: "524ea2324a590391a3e8b516",
		    email: "user@mail.com",
		    facebookId: "111111",
		    foods: [],
		    save: function (callback) {
			if (callback) {
			    callback(null);
			}
		    }
		};
		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findById", stub);
	return this;
    },
    stubRemove: function (stub) {
	if (!stub) {
	    throw new Error("You should specify stub");
	}
	sinon.stub(mongoose.Model.prototype, "remove", stub);
    },
    restore: function () {
	this.restoreSave();
	this.restoreFindOnce();
	this.restoreFindById();
	this.restoreRemove();
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
    },
    restoreRemove: function () {
	if (mongoose.Model.prototype.remove.restore) {
	    mongoose.Model.prototype.remove.restore();
	}
	return this;
    }
};

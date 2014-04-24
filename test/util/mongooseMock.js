var mongoose = require("mongoose");
var sinon = require("sinon");

module.exports = {
    user: function () {
	return {
		id: "524ea2324a590391a3e8b516",
		email: "user@mail.com",
		facebookId: "111111",
		authToken: "12345fajiwjfoe2523ijof",
		randos: [{
		    user: {
			user: "524ea2324a590391a3e8b516",
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			randoId: "3333",
			imageURL: "http://rando4.me/image/3333",
			mapURL: "http://rando4.me/image/4444",
			report: 0,
			bonAppetit: 0
		    },
		    stranger: {
			localtion: {
			    latitude: 53.932,
			    longitude: 27.3243
			},
			user: "724ea2324a590391a3e8b516",
			randoId: "3333",
			imageURL: "http://rando4.me/image/3333",
			mapURL: "http://rando4.me/map/444",
			report: 0,
			bonAppetit: 0 
		    }
		}],
		save: function (callback) {
		    if (callback) {
			callback(null);
		    }
		}
	    }
    },
    stubSave: function (stub) {
	if (!stub) {
	    stub = function (callback) {
		callback(null, {
		    id: "524ea2324a590391a3e8b516",
		    email: "user@mail.com",
		    authToken: "fwiojf23j424",
		    facebookId: "111111",
		    randos: []
		});
	    };
	}
	sinon.stub(mongoose.Model.prototype, "save", stub);
	return this;
    },
    stubFind: function (stub) {
	if (!stub) throw new Error("You forgot about stub");
	sinon.stub(mongoose.Model, "find", stub);
	return this;
    },
    stubFindOne: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {
		    id: "524ea2324a590391a3e8b516",
		    email: email,
		    facebookId: "111111", authToken: "4kjafojif32oij4o32ij4o",
		    randos: [{
			user: {
			    user: "524ea2324a590391a3e8b516",
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    randoId: "3333",
			    imageURL: "http://rando4.me/image/3333",
			    mapURL: "http://rando4.me/image/4444",
			    report: 0,
			    bonAppetit: 0
			},
			stranger: {
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    user: "724ea2324a590391a3e8b516",
			    randoId: "3333",
			    imageURL: "http://rando4.me/image/3333",
			    mapURL: "http://rando4.me/map/444",
			    report: 0,
			    bonAppetit: 0 
			}
		    }],
		    save: function (callback) {
			if (callback) {
			    callback(null);
			};
		    }
		};

		user.__proto__ = mongoose.model("user").prototype;

		callback(null, user);
	    };
	}
	sinon.stub(mongoose.Model, "findOne", stub);
	return this;
    },
    stubFindUserWithNotPairedRando: function (stub) {
	if (!stub) {
	    stub = function (email, callback) {
		var user = {
		    id: "524ea2324a590391a3e8b516",
		    email: email,
		    facebookId: "111111",
		    authToken: "4kjafojif32oij4o32ij4o",
		    randos: [{
			user: {
			    user: "524ea2324a590391a3e8b516",
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    randoId: "3333",
			    imageURL: "http://rando4.me/image/3333",
			    creation: 123456789,
			    mapURL: "http://rando4.me/image/4444",
			    report: 0,
			    bonAppetit: false
			},
			stranger: {
			    localtion: {
				latitude: 0,
				longitude: 0
			    },
			    user: "",
			    randoId: "",
			    imageURL: "",
			    mapURL: "",
			    report: 0,
			    bonAppetit: 0 
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
		    authToken: "fiowmifj32432ojfe",
		    facebookId: "111111",
		    randos: []
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
		    email: "user@mail.ru",
		    authToken: "4kjafojif32oij4o32ij4o",
		    facebookId: "111111",
		    randos: [{
			user: {
			    user: "524ea2324a590391a3e8b516",
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    randoId: "3333",
			    imageURL: "http://rando4.me/image/3333",
			    mapURL: "http://rando4.me/image/4444",
			    report: 0,
			    bonAppetit: 0
			},
			stranger: {
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    user: "724ea2324a590391a3e8b516",
			    randoId: "3333",
			    imageURL: "http://rando4.me/image/3333",
			    mapURL: "http://rando4.me/map/444",
			    report: 0,
			    bonAppetit: 0 
			}
		    }, {
			user: {
			    user: "524ea2324a590391a3e8b516",
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    randoId: "8888",
			    imageURL: "http://rando4.me/image/8888",
			    mapURL: "http://rando4.me/image/4444",
			    report: 0,
			    bonAppetit: 0
			},
			stranger: {
			    localtion: {
				latitude: 53.932,
				longitude: 27.3243
			    },
			    user: "724ea2324a590391a3e8b516",
			    randoId: "9999",
			    imageURL: "http://rando4.me/image/9999",
			    mapURL: "http://rando4.me/map/444",
			    report: 0,
			    bonAppetit: 0 
			}
		    }],
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
	this.restoreFind();
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
    restoreFind: function () {
	if (mongoose.Model.find.restore) {
	    mongoose.Model.find.restore();
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

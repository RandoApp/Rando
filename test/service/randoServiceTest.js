var should = require("should");
var sinon = require("sinon");
var randoService = require("../../src/service/randoService");
var mapService = require("../../src/service/mapService");
var s3Service = require("../../src/service/s3Service");
var util = require("../../src/util/util");
var fs = require("fs");
var gm = require("gm").subClass({ imageMagick: true });
var db = require("randoDB");
var Errors = require("../../src/error/errors");

describe('Rando service.', function () {
    describe('Save image.', function () {

	 	//restore all stubs because we can have a case:
	 	//Call parralel two funtions and both use stubs. One of stub can be frozen and break next test.
    	afterEach(function() {
    	 	if (db.rando.add.restore) {
    	 		db.rando.add.restore();
    	 	}


    	 	if (db.user.update.restore) {
    	 		db.user.update.restore();
    	 	}

    	 	if (fs.rename.restore) {
    	 		fs.rename.restore();
    	 	}

    	 	if (fs.unlink.restore) {
    	 		fs.unlink.restore();
    	 	}

    	 	if (s3Service.upload.restore) {
    	 		s3Service.upload.restore();
    	 	}

    	 	if (gm.prototype.write.restore) {
    	 		gm.prototype.write.restore();
    	 	}

    	 	if (util.generateImageName.restore) {
    	 		util.generateImageName.restore();
    	 	}
    	 });

	it('Should return incorrect args error when rando path is undefined', function (done) {
	    randoService.saveImage({email: "user@mail.com"}, null, {latitude: "32", longitude: "23"}, function (err) {
                err.should.eql(Errors.IncorrectArgs());
		done();
	    });
	});

	it('Should return system error whem image path is not exist', function (done) {
	    randoService.saveImage({email: "user@mail.com"}, "/tmp/not-exists-image.jpg", {latitude: "32", longitude: "23"}, function (err) {
                err.rando.should.be.eql(Errors.System(new Error("errno 34")).rando);
		done();
	    });
	});

	it('Should return system error when Generate Image Name return error', function (done) {
	    var called = false;
	    sinon.stub(util, "generateImageName", function (callback) {
			called = true;
			callback(Errors.System(new Error()));
	    });

	    randoService.saveImage({user: "user@mail.com"}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		called.should.be.true;
                err.rando.should.be.eql(Errors.System(new Error()).rando);
		done();
	    });
	});

	it('Should return system error, when db error', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

            sinon.stub(db.rando, "add", function (rando, callback) {
                callback(new Error("Some db error"));
            });

            sinon.stub(db.user, "update", function (user) {
                //do nothing
            });

	    sinon.stub(fs, "rename", function (source, dest, callback) {
			callback(null);
	    });
	    sinon.stub(fs, "unlink", function (file, callback) {
			callback(null);
	    });
        sinon.stub(s3Service, "upload", function (file, size, callback) {
            callback(null, "http://rando4me/image/someimage.jpg");
        });
	    
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
			callback();
	    });

	    randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		err.rando.should.be.eql(Errors.System(new Error()).rando);

		done();
	    });
	});

	it('Should return system error when upload image with error to S3', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];

	    sinon.stub(fs, "rename", function (source, dest, callback) {
			callback(null);
	    });
            sinon.stub(s3Service, "upload", function (file, size, callback) {
                callback(Errors.System(new Error("S3 error")));
            });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err) {
		err.rando.should.be.eql(Errors.System(new Error()).rando);

		done();
	    });
	});

	it('Should successful save image', function (done) {
	    mapService.cities = [{name: "Lida", latitude: 53.8884794302, longitude: 25.2846475817}];
	    var renameCalled = false;
            sinon.stub(db.rando, "add", function (rando, callback) {
                db.rando.add.restore();
                callback();
            });

            sinon.stub(db.user, "update", function (user) {
                //do nothing
                db.user.update.restore();
            });
	    sinon.stub(fs, "rename", function (source, dest, callback) {
		renameCalled = true;
		fs.rename.restore();
		callback(null);
	    });
            sinon.stub(s3Service, "upload", function (file, size, callback) {
                callback(null, "http://rando4me/image/someimage.jpg");
            });
	    sinon.stub(fs, "unlink", function (file, callback) {
		callback(null);
	    });
	    sinon.stub(gm.prototype.__proto__, "write", function (path, callback) {
		callback();
	    });

	    randoService.saveImage({email: "user@mail.com", out:[], in:[]}, "/tmp/some-image.png", {latitude: "32", longitude: "23"}, function (err, imageURL) {
		renameCalled.should.be.true;
		should.not.exist(err);
		should.exist(imageURL);

		done();
	    });
	});
    });
});

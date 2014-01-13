var express = require("express");
var config = require("config");
var logger = require("./src/log/logger");
var userService = require("./src/service/userService");
var commentService = require("./src/service/commentService");
var foodService = require("./src/service/foodService");
var mongodbConnection = require("./src/model/db").establishConnection();
var Errors = require("./src/error/errors");
var pairFoodsService = require("./src/service/pairFoodsService");
var app = express();

pairFoodsService.startDemon();

app.use(express.static(__dirname + '/static', {maxAge: config.app.cacheControl}));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());

app.post('/food/:token', function (req, res, next) {
    logger.data("POST /food");

    userService.forUserWithToken(req.params.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	foodService.saveFood(user, req.files.image.path, {lat: req.body.latitude, long: req.body.longitude},  function (err, response) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }

	    res.status(200);
	    //TODO: Orginize response into the service, not in the controller - server.js
//	    res.send('{"foodUrl": "' + foodUrl + '", "creation":"' + Date.now() + '"}')
	    res.send(response);
	});
    });
});

app.post('/report/:id/:token', function (req, res) {
    logger.data("POST /report/:id");

    userService.forUserWithToken(req.params.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	commentService.report(user, req.params.id, function (err, response) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }

	    res.send(response);
	});
    });
});

app.post('/bonappetit/:id/:token', function (req, res) {
    logger.data("POST /bonappetit/:id");

    userService.forUserWithToken(req.params.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	commentService.bonAppetit(user, req.params.id, function (err, response) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }
	    res.send(response);
	});
    });
});

app.post('/user', function(req, res) {
    userService.findOrCreateByLoginAndPassword(req.body.email, req.body.password, function(err, response) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	return res.send(response);
    }));
});

app.get('/user/:token', function (req, res) {
    userService.forUserWithToken(req.params.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	userService.getUser(user, function (err, user) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }
	    res.send(user);
	});
    });
});

app.post('/anonymous', function (req, res) {
    userService.findOrCreateAnonymous(req.body.id, function (err, response) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	res.status(200);
	res.send(response);
    });
});

app.post('/facebook', function (req, res) {
    userService.verifyFacebookAndFindOrCreateUser(req.body.id, req.body.email, req.body.token, function (err, reponse) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	res.status(200);
	res.send(response);
    });
});

app.post('/logout/:token', function (req, res) {
    userService.forUserWithToken(req.params.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	userService.destroyAuthToken(user, function (err, response) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }
	    res.status(200);
	    res.send(response);
	});
    });
});

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

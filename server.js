var express = require("express");
var config = require("config");
var logger = require("./src/log/logger");
var user = require("./src/service/userService");
var comment = require("./src/service/commentService");
var food = require("./src/service/foodService");
var passport = require("passport");
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var MongoStore = require('connect-mongo')(express);
var mongodbConnection = require("./src/model/db").establishConnection();
var Errors = require("./src/error/errors");
var app = express();

passport.use(new FacebookStrategy({
    clientID: config.app.fb.id,
    clientSecret: config.app.fb.secret,
    callbackURL: "/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
    user.findOrCreateByFBData(profile._json, done);
}));

passport.use(new LocalStrategy(function(email, password, done) {
    user.findOrCreateByLoginAndPassword(email, password, done);
}));


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    done(null, id);
});

app.use(express.static(__dirname + '/static'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
    secret: config.app.secret,
    store: new MongoStore({mongoose_connection: mongodbConnection})
}));
app.use(passport.initialize());

app.post('/food', function (req, res, next) {
    logger.data("POST /food");
    if (isNotAuthorized(req, res)) {
	return;
    }

    var userId = req.session.passport.user;
    food.saveFood(userId, req.files.image.path, {lat: req.quiery.latitude, long: req.quire.longitude},  function (err, foodUrl) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	res.status(200);
	res.send('{"url": "' + foodUrl + '"}')
    });
});

app.post('/report/:id', function (req, res) {
    logger.data("POST /report/:id", req);
    if (isNotAuthorized(req, res)) {
	return;
    }

    var userId = req.session.passport.user;
    logger.debug("REPORT");
    comment.report(userId, req.params.id, function (err) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	res.send('Image ' + req.params.id + ' reported');
    });
});

app.post('/bonappetit/:id', function (req, res) {
    logger.data("POST /bonappetit/:id", req);
    if (isNotAuthorized(req, res)) {
	return;
    }

    var userId = req.session.passport.user;
    comment.bonAppetit(userId, req.params.id, function (err) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}
	res.send('Bon appetit ' + req.params.id);
    });
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
});

app.post('/user', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}
	if (!user) {
	    req.session.messages = [info.message];
	    return res.redirect('/login')
	}
	req.logIn(user, function(err) {
	    if (err) {
		var response = Errors.toResponse(err);
		res.status(response.status);
		res.send(response);
		return;
	    }
	    return res.send('OK');
	});
    })(req, res, next);
});

app.get('/user', function (req, res) {
    if (isNotAuthorized(req, res)) {
	return;
    }

    var userId = req.session.passport.user;
    user.getUser(userId, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}
	res.send(user);
    });
});

app.post('/anonymous', function (req, res) {
    user.findOrCreateAnonymous(req.body.id, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	req.session.passport = {user: user};

	res.status(200);
	res.send("Ok");
    });
});

app.post('/facebook', function (req, res) {
    user.verifyFacebookAndFindOrCreateUser(req.body.id, req.body.email, req.body.token, function (err, user) {
	if (err) {
	    var response = Errors.toResponse(err);
	    res.status(response.status);
	    res.send(response);
	    return;
	}

	req.session.passport = {user: user};

	res.status(200);
	res.send("Ok");
    });
});

app.post('/logout', function (req, res) {
    req.session.destroy();
    res.status(200);
    res.send("Ok");
});

function isNotAuthorized (req, res) {
    logger.debug("Check authorisation");
    if (req.session.passport && req.session.passport.user) {
	logger.debug("User authorized: " + req.session.passport.user);
	return false;
    }

    logger.debug("Session or user is empty. Send Unauthorized error.");
    var response = Errors.toResponse(Errors.Unauthorized());
    res.status(response.status);
    res.send(response);
    return true;
}

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

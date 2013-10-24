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
    var userId = req.session.passport.user;
    food.saveFood(userId, req.files.image.path, {lat: req.quiery.latitude, long: req.quire.longitude},  function (err) {
	if (err) {
	    var response = Errors.toReponse(err);
	    res.status(response.code);
	    res.send(response);
	    return;
	}

	res.status(200);
	res.send("Ok");
    });
});

app.post('/report/:id', function (req, res) {
    logger.data("POST /report/:id", req);
    var userId = req.session.passport.user;
    comment.report(req.query.email, req.params.id, function (err) {
	if (err) {
	    var response = Errors.toReponse(err);
	    res.status(response.code);
	    res.send(response);
	    return;
	}

	res.send('Image ' + req.params.id + ' reported');
    });
});

app.post('/bonappetit/:id', function (req, res) {
    logger.data("POST /bonappetit/:id", req);
    var userId = req.session.passport.user;
    comment.bonAppetit(req.query.email, req.params.id, function (err) {
	if (err) {
	    var response = Errors.toReponse(err);
	    res.status(response.code);
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
	    var response = Errors.toReponse(err);
	    res.status(response.code);
	    res.send(response);
	    return;
	}
	if (!user) {
	    req.session.messages = [info.message];
	    return res.redirect('/login')
	}
	req.logIn(user, function(err) {
	    if (err) {
		var response = Errors.toReponse(err);
		res.status(response.code);
		res.send(response);
		return;
	    }
	    return res.send('OK');
	});
    })(req, res, next);
});

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

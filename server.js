var express = require("express");
var config = require("config");
var logger = require("./src/log/logger");
var user = require("./src/service/userService");
var comment = require("./src/service/commentService");
var food = require("./src/service/foodService");
var passport = require("passport");
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var app = express();

require("./src/model/db").establishConnection();

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new FacebookStrategy({
    clientID: config.app.fb.id,
    clientSecret: config.app.fb.secret,
    callbackURL: "/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
    user.findOrCreateByFBData(profile._json, done);
}));

passport.use(new LocalStrategy(function(email, password, done) {
    console.warn("USRENAME: ", email);
    console.warn("pas: ", password);
    user.findOrCreateByLoginAndPassword(email, password, done);
}));

app.use(express.static(__dirname + '/foods'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "config.app.secretKey" }));
app.use(passport.initialize())

app.post('/food', function (req, res, next) {
    food.saveFood(req.files.image.path, function (err) {
	if (err) {
	    res.send("Error: " + err);
	    return;
	}

	res.send("Ok");
    });
});

app.get('/food', function (req, res) {
    res.send('Here is food for you.'); 
});

app.post('/report/:id', function (req, res) {
    logger.data("POST /report/:id", req);
    comment.report(req.query.email, req.params.id, function (err) {
	if (err) {
	    res.send('Error when report');
	    return;
	}

	res.send('Image ' + req.params.id + ' reported');
    });
});

app.post('/bonappetit/:id', function (req, res) {
    logger.data("POST /bonappetit/:id", req);
    comment.bonAppetit(req.query.email, req.params.id, function (err) {
	if (err) {
	    res.send('Error bon appetit');
	    return;
	}
	res.send('Bon appetit ' + req.params.id);
    });
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
});

app.post('/user', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
	logger.debug("YYYYYY");
	if (err) {
	    res.send("ERROR: " + err);
	    return;
	}
	if (!user) {
	    req.session.messages = [info.message];
	    return res.redirect('/login')
	}
	req.logIn(user, function(err) {
	    if (err) {
		res.send("ERROR: " + err);
		return;
	    }
	    return res.send('OK');
	});
    })(req, res);
});

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

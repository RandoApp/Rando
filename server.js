var express = require("express");
var path = require("path");
var app = express();
var config = require("config");
var logger = require("./src/log/logger");
var everyauth = require("everyauth");
var user = require("./src/service/userService");
var comment = require("./src/service/commentService");

everyauth.debug = true;

require("./src/model/db").establishConnection();

everyauth.everymodule.findUserById(user.findUserById);

everyauth
  .facebook
    .appId(config.app.fb.id)
    .appSecret(config.app.fb.secret)
    .findOrCreateUser(function (session, accessToken, accessTokenExtra, fbUserMetadata) {
	logger.data("Facebook audentification: ", fbUserMetadata);

	var promise = this.Promise();
	user.findOrCreateByFBData(fbUserMetadata, promise);
	return promise;
    })
    .scope("email")
    .redirectPath('/');

app.use(app.router);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('mr ripley'));
app.use(express.session());
app.use(everyauth.middleware(app));

app.post('/food', function (req, res) {
    res.send('Thanks for posting your food.');
});

app.get('/food', function (req, res) {
    res.send('Here is food for you.'); 
});

app.post('/report/:id', function (req, res) {
    logger.data("POST /report/:id", req);
    comment.report(req.params.id, function (err) {
	if (err) {
	    res.send('Error when report');
	    return;
	}

	res.send('Image ' + req.params.id + ' reported');
    });
});

app.post('/bonappetit/:id', function (req, res) {
    logger.data("POST /bonappetit/:id", req);
    comment.bonAppetit(req.params.id, function (err) {
	if (err) {
	    res.send('Error when Bon appetit ');
	    return;
	}
	res.send('Bon appetit ' + req.params.id);
    });
});

app.post('/user', function (req, res) {
    logger.data("POST /user ", req);
    user.registerByEmailAndPassword(req.query.email, req.query.password, function (err) {
	if (err) {
	    res.send('Registration error: ' + err);
	    return;
	}

	res.send('registration');
    });
});

app.post('/user/:id', function (req, res) {
    res.send('audentification');
});

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

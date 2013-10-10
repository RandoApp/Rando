var express = require("express");
var config = require("config");
var everyauth = require("everyauth");
var logger = require("./src/log/logger");
var user = require("./src/service/userService");
var comment = require("./src/service/commentService");
var food = require("./src/service/foodService");
var app = express();

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

app.use(express.static(__dirname + '/foods'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('mr ripley'));
app.use(express.session());
app.use(everyauth.middleware(app));
app.use(app.router);

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

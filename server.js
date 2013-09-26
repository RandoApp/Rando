var express = require("express");
var path = require("path");
var app = express();
var config = require("config");
var logger = require("./src/log/logger");
var everyauth = require("everyauth");
var account = require("./src/service/account");

everyauth.debug = true;

require("./src/model/db").establishConnection();

everyauth.everymodule.findUserById(account.findUserById);

everyauth
  .facebook
    .appId(config.app.fb.id)
    .appSecret(config.app.fb.secret)
    .findOrCreateUser(function (session, accessToken, accessTokenExtra, fbUserMetadata) {
	logger.data("Facebook audentification: ", fbUserMetadata);

	var promise = this.Promise();
	account.findOrCreateByFBData(fbUserMetadata, promise);
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
    res.send('Image ' + req.params.id + ' reported');
});

app.post('/bonappetit/:id', function (req, res) {
    res.send('Bon appetit ' + req.params.id);
});

app.listen(config.app.port, function () {
    logger.info('Express server listening on port ' + config.app.port);
});

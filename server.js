var express = require("express");
var path = require("path");
var app = express();
var config = require("config");
var logger = require("winston");
require("./src/model/db").establishConnection();

logger.exitOnError = false;
logger.add(logger.transports.File, {
    filename: config.app.log.file,
    handleException: config.app.log.handleException
});

app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(app.router);

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

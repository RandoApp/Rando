var express         = require('express');
var path            = require('path'); // module allows path parsing
var app = express();

app.use(express.favicon()); // send favicon TODO: change to real favicon
app.use(express.logger('dev')); // log all requests
app.use(express.bodyParser()); // standart module for JSON parsing
app.use(express.methodOverride()); // put and delete support
app.use(app.router);
app.use(express.static(path.join(__dirname, "public"))); // запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)

app.post('/food', function (req, res) {
    res.send('Thanks for posting your food.');
});

app.get('/food', function (req, res) {
    res.send('Here is food for you.');
});

app.post('/report/:id', function (req, res) {
    res.send('Image '+req.params.id+' reported.');
});

app.post('/bonappetit/:id', function (req, res) {
    res.send('Bon appetit '+req.params.id);
});

app.listen(8888, function(){
    console.log('Express server listening on port 8888');
});
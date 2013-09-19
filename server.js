var http = require("http");
var CONF = require("config");

http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Foodex");
    response.end();
}).listen(CONF.app.port);

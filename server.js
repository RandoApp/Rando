var fs = require("fs");
var config = require("config");
var express = require("express");
var morgan  = require("morgan");
var bodyParser = require("body-parser");
var multer  = require("multer");

(function checkSources() {
  if (!fs.existsSync(config.app.citiesJson)) {
    console.error("File " + config.app.citiesJson + " not found. Did you run map.js script from git@github.com:RandoApp/Map.git repository before start server?\n");
    process.exit(1);
  }

  if (!fs.existsSync(config.app.geoipDBPath)) {
    console.error("File " + config.app.geoipDBPath + " not found. Did you download maxmind db file?\n");
    process.exit(1);
  }

  if (!fs.existsSync("./node_modules/randoRecognition/package.json")) {
    console.error("randoRecognition module not found. Please copy randoRecognition in node_modules folder\n");
    process.exit(1);
  }
})();

var access = require("./src/service/access");
var tokenConverter = require("./src/util/backwardCompatibility").tokenConverter;

var logger = require("./src/log/logger");

var userService = require("./src/service/userService");
const loginService = require("./src/service/loginService");
var commentService = require("./src/service/commentService");
var randoService = require("./src/service/randoService");
var logService = require("./src/service/logService");
var statusService = require("./src/service/statusService");
var shareService = require("./src/service/shareService");

var accessByTokenFilter = require("./src/filter/accessByTokenFilter");
var ipFilter = require("./src/filter/ipFilter");
var fireBaseFilter = require("./src/filter/firebaseFilter");
var blockBannedFilter = require("./src/filter/blockBannedFilter");
var flushUserMetaToDBFilter = require("./src/filter/flushUserMetaToDBFilter");
var noSpamFilter = require("./src/filter/noSpamFilter");

var baseFilters = [accessByTokenFilter.run, ipFilter.run, fireBaseFilter.run, flushUserMetaToDBFilter.run];

var Errors = require("./src/error/errors");

var app = express();
var upload = multer({ dest: "/tmp/" });


require("randoDB").connect(config.db.url);

app.use(morgan("combined"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.get("/status", function (req, res) {
  statusService.status(function (status) {
    var statusCode = 200;
    if (!status || Object.values(status).filter(s => s === "fail").length >= 1) {
      statusCode = 500;
    }

    res.status(statusCode).send(status);
  });
});

function postImage(lightUser, file, location, res) {
  randoService.saveImage(lightUser, file, location, function (err, response) {
    if (err) {
      var errResponse = Errors.toResponse(err);
      logger.data("POST /image DONE with error: ", errResponse.code);
      return res.status(errResponse.status).send(errResponse);
    }

    logger.data("POST /image DONE");
    return res.status(200).send(response);
  });
};

app.post("/image", baseFilters, blockBannedFilter.run, noSpamFilter.run, upload.single("image") , function (req, res) {
  if (!req.file || !req.file.originalname || !req.file.path || !req.file.size) {
    req.file = {
      originalname: null,
      path: null,
      size: null
    };
  }
  postImage(req.lightUser, {originalName: req.file.originalname, path: req.file.path, size: req.file.size}, {latitude: parseFloat(req.body.latitude), longitude: parseFloat(req.body.longitude)}, res);
});

app.post("/delete/:randoId", baseFilters, function (req, res) {
  logger.data("Start process user request. POST /delete. Id:", req.params.randoId , "for user:", req.lightUser.email);

  commentService.delete(req.lightUser, req.params.randoId, function (err, response) {
    if (err) {
      var response = Errors.toResponse(err);
      logger.data("POST /delete DONE with error: ", response.code);
      return res.status(response.status).send(response);
    }

    logger.data("POST /delete DONE");
    res.send(response);
  });
});

app.post("/report/:randoId", baseFilters, function (req, res) {
  logger.data("Start process user request. POST /report. Id:", req.params.randoId , "for user:", req.lightUser.email);

  commentService.report(req.lightUser, req.params.randoId, function (err, response) {
    if (err) {
      var response = Errors.toResponse(err);
      logger.data("POST /report DONE with error: ", response.code);
      return res.status(response.status).send(response);
    }

    logger.data("POST /report DONE");
    res.send(response);
  });
});

app.post("/rate/:randoId", baseFilters, (req, res) => {
  logger.data("Start process user request. POST /rate. Id:", req.params.randoId , "for user:", req.lightUser.email, "rating:", req.query.rating);

  commentService.rate(req.lightUser, req.params.randoId, req.query.rating, (err, response) => {
    if (err) {
      var response = Errors.toResponse(err);
      logger.data("POST /rate DONE with error: ", response.code);
      return res.status(response.status).send(response);
    }

    logger.data("POST /rate DONE");
    res.send(response);
  });
});

app.get("/user", baseFilters, function (req, res) {
  logger.data("Start process user request. GET /user. for: ", req.lightUser.email);

  userService.getUser(req.lightUser.email, (err, user) => {
    if (err) {
      var response = Errors.toResponse(err);
      res.status(response.status);
      logger.data("GET /user DONE with error: ", response.code);
      return res.send(response);
    }
    logger.data("GET /user DONE");
    return res.send(user);
  });
});

app.post("/user", function(req, res) {
  logger.data("Start process user request. POST /user. Email: ", req.body.email, " Password length: " , req.body.password.length);

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  loginService.loginRandoUser(req.body.email, req.body.password, ip, req.body.firebaseInstanceId, (err, response) => {
    if (err) {
      const response = Errors.toResponse(err);
      res.status(response.status);
      logger.data("POST /user DONE with error: ", response.code);
      return res.send(response);
    }

    logger.data("POST /user DONE");
    res.send(response);
  });
});

app.post("/anonymous", function (req, res) {
  logger.data("Start process user request. POST /anonymous. id: ", req.body.id);

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  loginService.loginAnonymous(req.body.id, ip, req.body.firebaseInstanceId, (err, response) => {
    if (err) {
      var response = Errors.toResponse(err);
      res.status(response.status);
      logger.data("POST /anonymous DONE with error: ", response.code);
      return res.send(response);
    }

    logger.data("POST /anonymous DONE");
    res.status(200);
    res.send(response);
  });
});

app.post("/google", function (req, res) {
  logger.data("Start process user request. POST /google. Email: ", req.body.email,  " Google Token length: ", req.body.token.length);

  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  loginService.loginGoogleUser(req.body.email, req.body.token, ip, req.body.firebaseInstanceId, (err, response) => {
    if (err) {
      var response = Errors.toResponse(err);
      res.status(response.status);
      logger.data("POST /google DONE with error: ", response.code);
      return res.send(response);
    }

    logger.data("POST /google DONE");
    res.status(200);
    res.send(response);
  });
});

function logout(req, res) {
  userService.destroyAuthToken(req.lightUser.email, function (err, response) {
    if (err) {
      var errResponse = Errors.toResponse(err);
      logger.data("POST /logout DONE with error: ", errResponse.code);
      return res.status(errResponse.status).send(errResponse);
    }

    logger.data("POST /logout DONE");
    return res.status(200).send(response);
  });
};

app.post("/logout", accessByTokenFilter.run, ipFilter.run, flushUserMetaToDBFilter.run, function (req, res) {
  logout(req, res);
});


app.get("/s/:randoId", function (req, res) {
  logger.data("Start process user request. GET /s/", req.params.randoId);
  shareService.generateHtmlWithRando(req.params.randoId, function (err, html) {
    if (err) {
      var response = Errors.toResponse(err);
      logger.data("GET /s/:randoId DONE with error: ", err);
      res.status(response.status).send(response);
      return;
    }
    res.send(html);
  });
});

app.listen(config.app.port, /*config.app.host,*/ function () {
  logger.info("Express server: http://" + config.app.host + ":" + config.app.port);
});

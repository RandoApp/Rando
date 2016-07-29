var cluster = require("cluster");

if (cluster.isMaster) {
  console.log("Star master");

  var cpuCount = require("os").cpus().length;
  for (var i = 0; i < cpuCount; i++) {
    cluster.fork();
  }
} else {
  console.log("Star worker #" + cluster.worker.id);

  var fs = require("fs");
  var express = require("express");
  var morgan  = require("morgan");
  var bodyParser = require("body-parser");
  var multer  = require("multer");
  var access = require("./src/service/access");
  var tokenConverter = require("./src/util/backwardCompatibility").tokenConverter;
  var config = require("config");
  var logger = require("./src/log/logger");
  var userService = require("./src/service/userService");
  var commentService = require("./src/service/commentService");
  var randoService = require("./src/service/randoService");
  var logService = require("./src/service/logService");
  var statusService = require("./src/service/statusService");
  var Errors = require("./src/error/errors");
  var app = express();
  var upload = multer({ dest: "/tmp/" });


  require("randoDB").connect(config.db.url);

  app.use(express.static(__dirname + "/static", {maxAge: config.app.cacheControl}));
  app.use(morgan("combined"));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());

  (function checkSources() {
    if (!fs.existsSync(config.app.citiesJson)) {
      console.error("File " + config.app.citiesJson + " not found. Did you run map.js script from git@github.com:RandoApp/Map.git repository before start server?\n");
      process.exit(1);
    }
  })();

  app.get("/status", function (req, res) {
    statusService.status(function (status) {
      res.send(status);
    });
  });

  app.post("/image", access.byToken, access.noSpam, upload.single("image") , function (req, res) {
    postImage(req.user, req.file.path, {latitude: req.body.latitude, longitude: req.body.longitude}, res);
  });

  function postImage(user, filePath, location, res) {
    randoService.saveImage(user, filePath, location, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        logger.data("POST /image DONE with error: ", response.code);
        res.status(response.status).send(response);
        return;
      }

      logger.data("POST /image DONE");
      res.status(200).send(response);
    });
  };

  app.post("/delete/:randoId", access.byToken, function (req, res) {
    logger.data("Start process user request. POST /delete. Id:", req.params.id ," for user: ", req.user);

    commentService.delete(req.user, req.params.randoId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        logger.data("POST /delete DONE with error: ", response.code);
        res.status(response.status).send(response);
        return;
      }

      logger.data("POST /delete DONE");
      res.send(response);
    });
  });

  app.post("/user", function(req, res) {
    logger.data("Start process user request. POST /user. Email: ", req.body.email, " Password length: " , req.body.password.length);

    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    userService.findOrCreateByLoginAndPassword(req.body.email, req.body.password, ip, req.body.firebaseInstanceId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("POST /user DONE with error: ", response.code);
        res.send(response);
        return;
      }

      logger.data("POST /user DONE");
      res.send(response);
    });
  });

  app.get("/user", access.byToken, function (req, res) {
    getUser(req, res);
  });

  function getUser(req, res) {
    logger.data("Start process user request. GET /user. for: ", req.user.email);
    userService.getUser(req.user, function (err, user) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("GET /user DONE with error: ", response.code);
        res.send(response);
        return;
      }
      logger.data("GET /user DONE");
      res.send(user);
    });
  };

  app.post("/anonymous", function (req, res) {
    logger.data("Start process user request. POST /anonymous. id: ", req.body.id);

    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    userService.findOrCreateAnonymous(req.body.id, ip, req.body.firebaseInstanceId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("POST /anonymous DONE with error: ", response.code);
        res.send(response);
        return;
      }

      logger.data("POST /anonymous DONE");
      res.status(200);
      res.send(response);
    });
  });

  app.post("/facebook", function (req, res) {
    logger.data("Start process user request. POST /facebook. Id:", req.body.id ," Email: ", req.body.email, " FB Token length: ", req.body.token.length);

    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    userService.verifyFacebookAndFindOrCreateUser(req.body.id, req.body.email, req.body.token, ip, req.body.firebaseInstanceId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("POST /facebook DONE with error: ", response.code);
        res.send(response);
        return;
      }

      logger.data("POST /facebook DONE");
      res.status(200);
      res.send(response);
    });
  });

  app.post("/google", function (req, res) {
    logger.data("Start process user request. POST /google. Email: ", req.body.email, "Family name: ", req.body.family_name, " Google Token length: ", req.body.token.length);

    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    userService.verifyGoogleAndFindOrCreateUser(req.body.email, req.body.family_name, req.body.token, ip, req.body.firebaseInstanceId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("POST /google DONE with error: ", response.code);
        res.send(response);
        return;
      }

      logger.data("POST /google DONE");
      res.status(200);
      res.send(response);
    });
  });

  function logout(user, req, res) {
    userService.destroyAuthToken(user, req.firebaseInstanceId, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        logger.data("POST /logout DONE with error: ", response.code);
        res.status(response.status).send(response);
        return;
      }

      logger.data("POST /logout DONE");
      res.status(200).send(response);
    });
  };

  app.post("/logout", access.byToken, function (req, res) {
    logout(req.user, res);
  });

  app.post("/log", function (req, res) {
    logger.data("Start process user request. POST /log. Token: ", req.params.token);
    var email = "anonymous";
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    logService.storeLog(email, req.body, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        res.status(response.status);
        logger.data("POST /log DONE with error: ", response.code);
        res.send(response);
        return;
      }

      logger.data("POST /log DONE");
      res.status(200);
      res.send(response);
    });
  });

  app.post("/log", access.byToken, function (req, res) {
    log(req.user, req.body, res);
  });

  function log (user, reqBody, res) {
    var email = "anonymous";
    if (user) {
      email = user.email;
    }

    logService.storeLog(email, reqBody, function (err, response) {
      if (err) {
        var response = Errors.toResponse(err);
        logger.data("POST /log DONE with error: ", response.code);
        res.status(response.status).send(response);
        return;
      }

      logger.data("POST /log DONE");
      res.status(200).send(response);
    });
  };

  
    //----------Delete this deprecation section, when all users will upgrade to up than 1.0.14 version----------

    //@deprecated
    app.post("/log/:token", tokenConverter, access.byToken, function (req, res) {
      logger.warn("DEPRECATED API CALL: POST /log/:token");
      log(req.user, req.body, res);
    });

    //@deprecated
    app.post("/logout/:token", tokenConverter, access.byToken, function (req, res) {
      logger.warn("DEPRECATED API CALL: POST /logout/:token");
      logout(req.user, res);
    });

    //@deprecated
    app.get("/user/:token", tokenConverter, access.byToken, function (req, res) {
      logger.warn("DEPRECATED API CALL: GET /user/:token");
      getUser(req, res);
    });

    //@deprecated
    app.post("/report/:id/:token", function (req, res) {
      logger.warn("DEPRECATED API CALL: POST/report/:id/:token");
      logger.data("Start process user request. POST /report. Id:", req.params.id ," Token: ", req.params.token);
      res.send();
    });

    //@deprecated
    app.post("/image/:token", tokenConverter, access.byToken, access.noSpam, upload.single("image"), function (req, res) {
      logger.warn("DEPRECATED API CALL: POST /image/:token");
      postImage(req.user, req.file.path, {latitude: req.body.latitude, longitude: req.body.longitude}, res);
    });
    //=========================================================================================================


    app.listen(config.app.port, /*config.app.host,*/ function () {
      logger.info("Express server listening on port " + config.app.port + " and host: " + config.app.host);
    });

  }

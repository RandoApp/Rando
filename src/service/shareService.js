var db = require("randoDB");
var logger = require("../log/logger");
var fs = require("fs");

var shareRandoHtmlTemplate = fs.readFileSync("template/share.template.html").toString();
var notFoundRandoHtmlTemplate = fs.readFileSync("template/404.template.html").toString();

module.exports = {
  generateHtmlWithRando (randoId, callback)  {
    db.user.getLightRandoByRandoId(randoId, function (err, data) {
      logger.debug("[shareService.generateHtmlWithRando]", "Start rendering html");
      var html = "";
      if (!err && data && data.out[0]) {
        var rando = data.out[0];
        html = shareRandoHtmlTemplate
          .replace("{{RANDO_URL}}", rando.imageURL)
          .replace("{{MAP_URL}}", rando.mapURL);
      } else {
        logger.warn("[shareService.generateHtmlWithRando]", "Cannot render html because rando is empty:", data);
        html = notFoundRandoHtmlTemplate;
      }

      callback(null, html);
    });
  }
};

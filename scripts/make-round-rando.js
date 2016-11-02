var imgService = require("../src/service/imageService");

if (!process.argv[2] || !process.argv[3]) {
  console.info("Please, use following format:");
  console.info("node scripts/make-round-rando.js originalPath finalPath");
  return;
}

var originPath = process.argv[2];
var finalPath = process.argv[3];

imgService.drawRando(originPath, finalPath, function (err, path) {
  if (err) {
    console.err("Error when draw round rando: " + err);
  } else {
    console.log("Done! You round rando here: " + path);
  }
});

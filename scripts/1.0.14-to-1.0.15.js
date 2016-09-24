var config = require("config");
var dbMigration = require("./1.0.14-1.0.15/dbMigration");

require("randoDB").connect(config.db.url);

dbMigration.run();

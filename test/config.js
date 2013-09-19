var should = require("should");

describe('Configuration', function () {
  describe('Port', function () {
    it('Server port should exist', function () {
	var config = require("config");
	should.exist(config.app.port);
    });
  });
});

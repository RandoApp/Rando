const should = require("should");
const sinon = require("sinon");
const userService = require("../../src/service/userService");
const Errors = require("../../src/error/errors");
const db = require("randoDB");
const passwordUtil = require("../../src/util/password");
const mockUtil = require("../mockUtil");

describe("User service.", () => {
  describe("Get user.", () => {
    afterEach(() => {
      mockUtil.clean(db);
    });

    it("Get user successfully", (done) => {
      sinon.stub(db.user, "getAllLightInAndOutRandosByEmail", (email, callback) => {
        callback(null, {
          out: [{
              randoId: 1,
              delete: 0,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              },
              strangerMapURL: "url",
              strangerMapSizeURL: {
                large: "largeUrl",
                medium: "mediumUrl",
                small: "smallUrl"
              }
            },
            {
              randoId: 2,
              delete: 1,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              },
              strangerMapURL: "url",
              strangerMapSizeURL: {
                large: "largeUrl",
                medium: "mediumUrl",
                small: "smallUrl"
              }
            },
            {
              randoId: 3,
              delete: 0,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              },
              strangerMapURL: "url",
              strangerMapSizeURL: {
                large: "largeUrl",
                medium: "mediumUrl",
                small: "smallUrl"
              }
            }
          ],
          in: [{
              randoId: 9,
              delete: 0,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              }
            },
            {
              randoId: 8,
              delete: 1,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              }
            },
            {
              randoId: 7,
              delete: 0,
              mapURL: "mapURL",
              mapSizeURL: {
                large: "largeMapUrl",
                medium: "mediumUMaprl",
                small: "smallMapUrl"
              }
            }
          ]
        });
      });

      userService.getUser("user@mail.com", (err, user) => {
        should.not.exist(err);
        should.exist(user);
        user.should.have.property("email", "user@mail.com");
        user.out.should.not.be.empty();
        user.in.should.not.be.empty();
        done();
      });
    });

  });
});

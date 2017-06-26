var sinon = require("sinon");

module.exports = {
  clean (object) {
    if (typeof object === "function") {
      if (object.restore) {
        object.restore();
      }
    } else {
      for (var method in object) {
        if (typeof object[method] === "object") {
          this.clean(object[method]);
        } else if (typeof object[method] === "function") {
          if (object[method].restore) {
            object[method].restore();
            console.log('clenup mythod:' + method);
          }
        }
      }
    }
  }
};

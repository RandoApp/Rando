module.exports = {
  clean (object) {
    for (var method in object) {
      if (typeof object[method] === "object") {
        this.clean(object[method]);
      } else if (typeof object[method] === "function") {
        if (object[method].restore) {
          object[method].restore();
        }
      }
    }
  }
};

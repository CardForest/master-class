'use strict';

module.exports = {
  noOp: {
    set: function (cb) {
      cb();
    }
  }
};

'use strict';

var MRef = require('../classes/mRef');

module.exports = function (opt) {
  if (opt == null) {
    opt = {};
  }

  return class extends MRef {
    static get opt() {return opt;}
  };
};

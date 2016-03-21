'use strict';

const MArray = require('../classes/mArray');

module.exports = function mArrayFactory(opt) {
  return class extends MArray {
    constructor(value, keyPath, control, parent) {
      // TODO don't pass opt directly and use this.constructor.opt in the constructor
      // -> waiting for new.target and array inheritance to be better supported
      super(value, keyPath, control, parent);
    }

    static get opt() {return opt;}
  };
};

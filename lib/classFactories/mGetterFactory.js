'use strict';

const makeReadOnlyFn = require('../utils/makeReadOnlyFn');

module.exports = function (getter) {
  if (typeof getter !== 'function') {
    throw TypeError('expected function');
  }
  return {
    toPropertyDescriptor() {
      return {
        enumerable: false,
        configurable: false,
        get: makeReadOnlyFn(getter)
      };
    }
  };
};

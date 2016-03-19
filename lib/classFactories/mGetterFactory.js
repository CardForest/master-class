'use strict';

var getterUtil = require('./../types/getterUtil');

module.exports = function (getter) {
  if (typeof getter !== 'function') {
    throw TypeError('expected function');
  }
  return {
    createInstance() {
      return getter;
    },

    toPropertyDescriptor(getter, control) {
      return {
        enumerable: false,
        configurable: false,
        get: getterUtil.makeReadOnlyFn(getter, control)
      };
    }
  };
};

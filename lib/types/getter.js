'use strict';

var getterUtil = require('./getterUtil');

class WrappedGetter {
  constructor(getter) {
    if (typeof getter !== 'function') {
      throw TypeError('expected function');
    }

    this.getter = getter;
  }

  createInstance() {
    return this.getter;
  }

  toPropertyDescriptor(getter, control) {
    return {
      enumerable: false,
      configurable: false,
      get: getterUtil.makeReadOnlyFn(getter, control)
    };
  }
}

module.exports = function (getter) {
  return new WrappedGetter(getter);
};

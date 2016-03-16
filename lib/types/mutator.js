'use strict';

var getterUtil = require('./getterUtil');

class WrappedMutator {
  constructor(opt) {
    if (typeof opt === 'function') {
      // syntactic sugar
      opt = {
        fn: opt
      };
    } else if (typeof opt.fn !== 'function') {
      // we can't find the mutator function
      throw TypeError('expected function');
    }

    this.opt = opt;
  }

  createInstance(unused1, keyPath, control, parent) { // jshint ignore:line
    var mutatorFn, originMutatorFn;
    mutatorFn = originMutatorFn = this.opt.fn;
    if (control.hasOwnProperty('onMutatorCall')) {
      mutatorFn = function () {
        return control.onMutatorCall.call(this, keyPath, Array.prototype.slice.call(arguments, 0), originMutatorFn);
      };
    }
    if (this.opt.hasOwnProperty('guard')) {
      var guard = getterUtil.makeReadOnlyFn(this.opt.guard, control);
      var fn = function () {
        if (guard.call(this) === true) {
          return mutatorFn.apply(this, arguments);
        } else {
          throw Error('mutator blocked by guard');
        }
      };
      Object.defineProperty(fn, 'guard', {
        enumerable: false,
        configurable: false,
        get: guard.bind(parent)
      });
      return fn;
    } else {
      return mutatorFn;
    }
  }

  toPropertyDescriptor(mutator) {
    return {
      enumerable: false,
      configurable: false,
      value: mutator,
      writable: false
    };
  }
}
module.exports = function (opt) {
  return new WrappedMutator(opt);
};

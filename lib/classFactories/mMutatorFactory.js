'use strict';

const makeReadOnlyFn = require('../utils/makeReadOnlyFn');

module.exports = function mMutatorFactory(opt) {
  if (typeof opt === 'function') {
    // syntactic sugar
    opt = {
      fn: opt
    };
  } else if (typeof opt.fn !== 'function') {
    // we can't find the mutator function
    throw TypeError('expected function');
  }

  return {
    opt,

    createInstance(unused1, keyPath, control, parent) {
      const originMutatorFn = opt.fn;
      const mutatorFn = function () {
        return control.onMutatorCall.call(this, keyPath, Array.prototype.slice.call(arguments, 0), originMutatorFn);
      };

      if (opt.hasOwnProperty('guard')) {
        var guard = makeReadOnlyFn(opt.guard, control);
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
    },

    toPropertyDescriptor(mutator) {
      return {
        enumerable: false,
        configurable: false,
        value: mutator,
        writable: false
      };
    }
  };
};

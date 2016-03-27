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

  const mutatorFn = opt.fn;
  let fn;
  let guard;
  if (opt.hasOwnProperty('guard')) {
    guard = makeReadOnlyFn(opt.guard);
    fn = function () {
      if (guard.call(this) === true) {
        return mutatorFn.apply(this, arguments);
      } else {
        throw Error('blocked by guard');
      }
    };
  } else {
    guard = function() {return true;};
    fn = mutatorFn;
  }

  return {
    toPrototypePropertyDescriptors(key) {
      return {[key]: {
        enumerable: false,
        configurable: false,
        value: fn
      }, [key + '$guard']: {
        enumerable: false,
        configurable: false,
        value: guard
      }};
    }
  };
};

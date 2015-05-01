'use strict';

function WrappedMutator(opt) {
  if (! (this instanceof WrappedMutator)) {
    return new WrappedMutator(opt);
  }

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

WrappedMutator.prototype.createInstance = function (unused1, keyPath, control) { // jshint ignore:line
  var mutatorFn = this.opt.fn;
  if (control.hasOwnProperty('onMutatorCall')) {
    return function() {
      return control.onMutatorCall.call(this, keyPath, Array.prototype.slice.call(arguments, 0), mutatorFn);
    };
  }
  return mutatorFn;
};

WrappedMutator.prototype.toPropertyDescriptor = function (mutator, control) {
  return {
    enumerable: false,
    configurable: false,
    value: mutator,
    writable: false
  };
};

module.exports = WrappedMutator;

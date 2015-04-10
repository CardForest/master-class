'use strict';

function WrappedMutator(mutator) {
  if (! (this instanceof WrappedMutator)) {
    return new WrappedMutator(mutator);
  }

  if (typeof mutator !== 'function') {
    throw TypeError('expected function');
  }

  this.mutator = mutator;
}

WrappedMutator.prototype.createInstance = function (unused1, keyPath, control) { // jshint ignore:line
  if (control.hasOwnProperty('onMutatorCall')) {
    var mutator = this.mutator;
    return function() {
      return control.onMutatorCall.call(this, keyPath, Array.prototype.slice.call(arguments, 0), mutator);
    };
  }
  return this.mutator;
};

WrappedMutator.prototype.toPropertyDescriptor = function (mutator, control) {
  return {
    enumerable: false,
    configurable: false,
    value: mutator,
    writable: false
  };
}

module.exports = WrappedMutator

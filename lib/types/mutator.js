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

WrappedMutator.prototype.createInstance = function (unused1, unused2, control) { // jshint ignore:line
  // TODO wrap mutator based on control parameters
  return this.mutator;
}

WrappedMutator.prototype.toPropertyDescriptor = function (mutator, control) {
  return {
    enumerable: true,
    configurable: false,
    value: mutator,
    writable: false
  };
}

module.exports = WrappedMutator

'use strict';

var KeyPath = require('key-path');

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
  var mutatorFn, originMutatorFn;
  mutatorFn = originMutatorFn = this.opt.fn;
  if (control.hasOwnProperty('onMutatorCall')) {
    mutatorFn = function() {
      return control.onMutatorCall.call(this, keyPath, Array.prototype.slice.call(arguments, 0), originMutatorFn);
    };
  }
  if (this.opt.hasOwnProperty('guardKeyPath')) {
    var guardAccessor = KeyPath.get(this.opt.guardKeyPath);
    return function () {
      if (guardAccessor.getValueFrom(control.root)) {
        mutatorFn.apply(this, arguments);
      } else {
        throw Error('mutator blocked by guard');
      }
    };
  } else {
    return mutatorFn;
  }
};

WrappedMutator.prototype.toPropertyDescriptor = function (mutator) {
  return {
    enumerable: false,
    configurable: false,
    value: mutator,
    writable: false
  };
};

module.exports = WrappedMutator;

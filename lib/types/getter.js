'use strict';

function WrappedGetter(getter) {
  if (! (this instanceof WrappedGetter)) {
    return new WrappedGetter(getter);
  }

  if (typeof getter !== 'function') {
    throw TypeError('expected function');
  }

  this.getter = getter;
}

WrappedGetter.prototype.createInstance = function () {
  return this.getter;
};

WrappedGetter.makeReadOnlyFn = function(fn, control) {
  return function() {
    if (control.isChangeAllowed) {
      control.isChangeAllowed = false;
      try {
        return fn.call(this);
      } finally {
        control.isChangeAllowed = true;
      }
    } else {
      return fn.call(this);
    }
  };
};

WrappedGetter.prototype.toPropertyDescriptor = function (getter, control) {
  return {
    enumerable: false,
    configurable: false,
    get: WrappedGetter.makeReadOnlyFn(getter, control)
  };
};

module.exports = WrappedGetter;

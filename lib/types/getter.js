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

WrappedGetter.prototype.toPropertyDescriptor = function (getter, control) {
  return {
    enumerable: false,
    configurable: false,
    get: function() {
      if (control.isChangeAllowed) {
        control.isChangeAllowed = false;
        try {
          return getter.call(this);
        } finally {
          control.isChangeAllowed = true;
        }
      } else {
        return getter.call(this);
      }
    }
  };
};

module.exports = WrappedGetter;

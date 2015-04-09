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
}

WrappedGetter.prototype.toPropertyDescriptor = function (getter, control) {
  return {
    enumerable: true,
    configurable: false,
    get: function() {
      if (control.isChangeAllowed) {
        control.isChangeAllowed = false;
        try {
          var res = getter.call(this);
        } finally {
          control.isChangeAllowed = true;
        }
        return res;
      } else {
        return getter.call(this);
      }
    }
  };
}

module.exports = WrappedGetter

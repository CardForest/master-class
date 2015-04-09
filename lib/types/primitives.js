'use strict';

function AbstractPrimitiveFactory(opt) {
  this.opt = (opt != null) ? opt : {};
}

AbstractPrimitiveFactory.prototype.instantiate = function(value) {
  if (value == null) {
    value = this.opt.initialValue;
  }
  if (value == null) {
    return this.primitive();
  } else {
    return this.primitive(value);
  }
};

AbstractPrimitiveFactory.prototype.toPropertyDescriptor = function(value, control) {
  return {
    enumerable: true,
    configurable: false,
    get: function () {
      return value;
    },
    set: function (newValue) {
      control.set(function () {
        if (typeof newValue !== typeof value) {
          throw TypeError('expected ' + typeof value);
        }
        value = newValue;
      });
    }
  };
};

function PrimitiveFactoryFactory(primitive) {
  function PrimitiveFactory(opt) {
    if (! (this instanceof PrimitiveFactory)) {
      return new PrimitiveFactory(opt);
    }
    AbstractPrimitiveFactory.call(this, opt);
  }

  PrimitiveFactory.prototype = Object.create(AbstractPrimitiveFactory.prototype);
  PrimitiveFactory.prototype.constructor = PrimitiveFactory;
  PrimitiveFactory.prototype.primitive = primitive;

  return PrimitiveFactory;
}

module.exports = {
  Number: PrimitiveFactoryFactory(Number),
  String: PrimitiveFactoryFactory(String),
  Boolean: PrimitiveFactoryFactory(Boolean)
};

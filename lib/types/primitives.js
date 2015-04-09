'use strict';

function AbstractPrimitiveFactory(opt) {
  this.opt = (opt != null) ? opt : {};

  if (this.opt.hasOwnProperty('initialValue') && typeof this.opt.initialValue !== this.primitiveTypeName) {
    throw TypeError('expected ' + this.primitiveTypeName);
  }
}

AbstractPrimitiveFactory.prototype.createInstance = function(value) {
  if (value == null) {
    value = this.opt.initialValue;
  }
  if (value == null) {
    return this.primitive();
  } else if (typeof value !== this.primitiveTypeName) {
    throw TypeError('expected ' + this.primitiveTypeName);
  } else {
    return this.primitive(value);
  }
};

AbstractPrimitiveFactory.prototype.toPropertyDescriptor = function(value, control) {
  var self = this;
  return {
    enumerable: true,
    configurable: false,
    get: function () {
      return value;
    },
    set: function (newValue) {
      control.set(function () {
        if (typeof newValue !== self.primitiveTypeName) {
          throw TypeError('expected ' + self.primitiveTypeName);
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
  PrimitiveFactory.prototype.primitiveTypeName = primitive.name.toLowerCase();

  return PrimitiveFactory;
}

module.exports = {
  Number: PrimitiveFactoryFactory(Number),
  String: PrimitiveFactoryFactory(String),
  Boolean: PrimitiveFactoryFactory(Boolean)
};

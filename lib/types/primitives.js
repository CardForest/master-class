'use strict';

function toPropertyDescriptor(value, control) {
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
}


function primitiveToFactory(Primitive) {
  var primitiveFactory = function (value, spec) {
    if (value == null) {
      value = spec.initialValue;
    }
    if (value == null) {
      return Primitive();
    } else {
      return Primitive(value);
    }
  };

  primitiveFactory.toPropertyDescriptor = toPropertyDescriptor;

  return primitiveFactory;
}

module.exports = {
  Number: primitiveToFactory(Number),
  String: primitiveToFactory(String),
  Boolean: primitiveToFactory(Boolean)
};

'use strict';

function defineProperty(self, value, keyPath, control, propSpec, key) {
  Object.defineProperty(
    self,
    key,
    propSpec.type.toPropertyDescriptor(
      propSpec.type(value[key], propSpec, keyPath.concat(key), control),
      control
    )
  );
}

function toPropertyDescriptor(value) {
  return {
    enumerable: true,
    configurable: false,
    value: value,
    writable: false
  };
}

module.exports = {
  defineProperty: defineProperty,
  toPropertyDescriptor: toPropertyDescriptor
};

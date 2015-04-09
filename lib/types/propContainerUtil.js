'use strict';

function defineProperty(self, value, keyPath, control, propFactory, key) {
  value = propFactory.createInstance(value[key], keyPath.concat(key), control);

  Object.defineProperty(
    self,
    key,
    propFactory.toPropertyDescriptor(
      value,
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

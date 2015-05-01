'use strict';

function defineProperty(self, value, keyPath, control, propFactory, key) {
  if (typeof propFactory !== 'object' || ! ('createInstance' in propFactory)) {
    throw Error('element in [' + keyPath.concat(key) + '] does not have a valid type');
  }
  if (value[key] !== '$hidden') {
    value = propFactory.createInstance(value[key], keyPath.concat(key), control);

    Object.defineProperty(
      self,
      key,
      propFactory.toPropertyDescriptor(
        value,
        control,
        keyPath,
        key
      )
    );
  }
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

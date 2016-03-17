'use strict';

function defineProperty(self, value, keyPath, control, propFactory, key) {
  if (typeof propFactory !== 'object' || ! ('createInstance' in propFactory)) {
    throw Error('element in [' + keyPath.concat(key) + '] does not have a valid type');
  }
  if (value[key] !== '$hidden') {
    value = propFactory.createInstance(value[key], keyPath.concat(key), control, self);

    Object.defineProperty(
      self,
      key,
      propFactory.toPropertyDescriptor(
        value,
        control,
        keyPath,
        key,
        self
      )
    );
  }
}

class PropertyContainerFactory {
  toPropertyDescriptor(value, control, keyPath, key, parent) {
    const self = this;
    return {
      enumerable: true,

      configurable: false,
      set(newValue) {
        if (! control.isChangeAllowed) {
          throw Error('change is not allowed in this context');
        }
        value = self.createInstance(newValue, keyPath.concat(key), control, parent);
        control.emit('change', 'setValue', {newValue: newValue, trgKeyPath: keyPath, key: key}, self.opt);
      },
      get() {return value;},
    };
  }
}

module.exports = {
  defineProperty,
  PropertyContainerFactory
};

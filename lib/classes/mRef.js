'use strict';

var KeyPath = require('key-path');
var MObject = require('../classes/mObject');

module.exports = class MRef {
  static createInstance(value) {
    if (value != null) {
      return value;
    }

    return {
      ref: null
    };
  }

  static toPropertyDescriptor(value, control, keyPath, key) {
    return {
      enumerable: true,
      configurable: false,
      get() {
        if (value.hasOwnProperty('keyPath')) {
          // relink to referred object on first access after snapshot
          value.ref = KeyPath.get(value.keyPath).getValueFrom(this[control.rootPropertyName]);
          delete value.keyPath;
        }
        return value.ref;
      },
      set: (newValue) => {
        if (!control.isChangeAllowed) {
          throw Error('change is not allowed in this context');
        }
        if (!(newValue instanceof MObject)) {
          throw TypeError('expected MObject');
        }
        //TODO support specific reference types

        value.ref = newValue;
        control.emit('change', 'setValue', {newValue: {keyPath: newValue.keyPath}, trgKeyPath: keyPath, key: key}, this.opt);
      }
    };
  }

  static snapshot(mapper, instance, keyPath) { // jshint ignore:line
    return (instance != null) ? {keyPath: instance.keyPath} : null;
  }
};

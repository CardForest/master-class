'use strict';

var KeyPath = require('key-path');
var MObject = require('../classes/mObject');

module.exports = function (opt) {
  opt = (opt != null) ? opt : {};

  return {
    opt,

    createInstance(value) {
      if (value != null) {
        return value;
      }

      return {
        ref: null
      };
    },

    toPropertyDescriptor(key) {
      const keySymbol = Symbol(`_${key}`);

      return {
        enumerable: true,
        configurable: false,
        get() {
          const _value = this[keySymbol];
          if (_value.hasOwnProperty('keyPath')) {
            // relink to referred object on first access after snapshot
            _value.ref = KeyPath.get(_value.keyPath).getValueFrom(this.$root);
            delete _value.keyPath;
          }
          return _value.ref;
        },
        set(value) {
          if (!this.$context.isChangeAllowed) {
            throw Error('change is not allowed in this context');
          }
          if (value instanceof MObject) {
            this[keySymbol] = {ref: value};
          } else if (value.hasOwnProperty('ref') || value.hasOwnProperty('keyPath')) {
            this[keySymbol] = value;
          } else {
            throw TypeError('expected MObject');
          }
        }
      };
    },

    snapshot(instance) {
      return (instance != null) ? {keyPath: instance.$keyPath} : null;
    }
  };
};

'use strict';

var KeyPath = require('key-path');
var WrappedObject = require('./object').WrappedObject;

function ReferenceFactory(opt) {
  if (! (this instanceof ReferenceFactory)) {
    return new ReferenceFactory();
  }

  this.opt = opt || {};
}

ReferenceFactory.prototype.createInstance = function(value) {
  if (value != null) {
    return value;
  }

  return {
    ref: null
  };
};

ReferenceFactory.prototype.toPropertyDescriptor = function(value, control, keyPath, key) {
  var self = this;
  return {
    enumerable: true,
    configurable: false,
    get: function () {
      if (value.hasOwnProperty('keyPath')) {
        // relink to referred object on first access after snapshot
        value.ref = KeyPath.get(value.keyPath).getValueFrom(this[control.rootPropertyName]);
        delete value.keyPath;
      }
      return value.ref;
    },
    set: function (newValue) {
      if (!control.isChangeAllowed) {
        throw Error('change is not allowed in this context');
      }
      if (!(newValue instanceof WrappedObject)) {
        throw TypeError('expected WrappedObject');
      }
      //TODO support specific reference types

      value.ref = newValue;
      control.onChange('setValue', {newValue: {keyPath: newValue.keyPath}, trgKeyPath: keyPath, key: key}, self.opt);
    }
  };
};

ReferenceFactory.prototype.snapshot = function (mapper, instance, keyPath) { // jshint ignore:line
  return (instance != null) ? {keyPath: instance.keyPath} : null;
};

module.exports = ReferenceFactory;

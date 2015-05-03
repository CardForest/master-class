'use strict';

var KeyPath = require('key-path');
var WrappedObject = require('./object').WrappedObject;

function ReferenceFactory() {
  if (! (this instanceof ReferenceFactory)) {
    return new ReferenceFactory();
  }
}

ReferenceFactory.prototype.createInstance = function(value, keyPath, control, isRootObject) {
  if (value != null) {
    return value;
  }

  return {
    ref: null
  };
};

ReferenceFactory.prototype.toPropertyDescriptor = function(value, control, keyPath, key) {
  return {
    enumerable: true,
    configurable: false,
    get: function () {
      if (value.hasOwnProperty('keyPath')) {
        // relink to referred object on first access after snapshot
        value.ref = KeyPath.get(value.keyPath).getValueFrom(control.root);
        delete value.keyPath;
      }
      return value.ref;
    },
    set: function (newValue) {
      control.set(function () {
        if (!newValue instanceof WrappedObject) {
          throw TypeError('expected WrappedObject');
        }
        //TODO support specific reference types
        value.ref = newValue;
      }, newValue, keyPath, key);
    }
  };
};

ReferenceFactory.prototype.snapshot = function (mapper, instance, keyPath) { // jshint ignore:line
  return (instance != null) ? {keyPath: instance.keyPath} : null;
};

module.exports = ReferenceFactory;

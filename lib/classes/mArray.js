'use strict';

const overridableSnapshot = require('../utils/overridableSnapshot');
const Control = require('../utils/control');

const MObject = require('./mObject');

class MArray extends Array {
  constructor(value, keyPath, control, parent) {
    super();

    const opt = this.constructor.opt;

    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

    const root = parent == null ?  this : parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent;

    Object.defineProperty(
      this,
      control.rootPropertyName,
      {
        enumerable: false,
        configurable: false,
        value: root,
        writable: false
      }
    );

    var length;
    if (value == null) {
      value = [];
      length = opt.defaultLength;
    } else {
      // allow overriding of length
      length = value.length;
    }
    this.length = length; // make sure this array has the correct length even if it has undefined elements

    var elem = opt.elem;

    for (var i = 0; i < length; i++) {
      this.constructor.defineProperty(this, value, keyPath, control, elem, i);
    }

    Object.freeze(this);
  }

  static get [Symbol.species]() {return Array;}

  static snapshot(mapper, instance, keyPath) {
    var res = [];
    for (var i = 0, length = instance.length; i < length; i++) {
      res[i] = overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
    }
    return res;
  }
}

MArray.createInstance = MObject.createInstance;
MArray.toPropertyDescriptor = MObject.toPropertyDescriptor;
MArray.defineProperty = MObject.defineProperty;

module.exports = MArray;

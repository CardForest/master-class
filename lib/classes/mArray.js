'use strict';

const MObject = require('./mObject');

class MArray extends Array {
  constructor(value) {
    super();

    Object.defineProperty(this, '$keyPath', {value: [], writable: true});
    Object.defineProperty(this, '$root', {value: this, writable: true});
    Object.defineProperty(this, '$context', {value: {isChangeAllowed: true}, writable: true});

    const opt = this.constructor.opt;

    let length;
    if (value == null) {
      value = [];
      length = opt.defaultLength;
    } else {
      length = value.length;
    }
    this.length = length;

    for (var i = 0; i < length; i++) {
          this[i] = opt.elem.createInstance(value[i]);
    }

    Object.seal(this);
  }

  static snapshot(instance) {
    var res = [];
    const length = instance.length;
    for (let i = 0; i < length; i++) {
      res[i] = this.opt.elem.snapshot(instance[i]);
    }
    return res;
  }
}

MArray.prototype.$snapshot = MObject.prototype.$snapshot;

MArray.createInstance = MObject.createInstance;
MArray.toPropertyDescriptor = MObject.toPropertyDescriptor;

module.exports = MArray;

'use strict';

const propContainerUtil = require('./../types/propContainerUtil');
const snapshotUtil = require('./../types/snapshotUtil');
const Control = require('../control');

const MObject = require('./mObject');

class MArray extends Array {
  constructor(value, keyPath, control) {
    super();

    const opt = this.constructor.opt;

    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

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
      propContainerUtil.defineProperty(this, value, keyPath, control, elem, i);
    }

    Object.freeze(this);
  }

  static snapshot(mapper, instance, keyPath) {
    var res = [];
    for (var i = 0, length = instance.length; i < length; i++) {
      res[i] = snapshotUtil.overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
    }
    return res;
  }
}

MArray.createInstance = MObject.createInstance;
MArray.toPropertyDescriptor = MObject.toPropertyDescriptor;

module.exports = MArray;

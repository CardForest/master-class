'use strict';

var inheritArray = require('inherit-array');

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

var Control = require('../control');

function WrappedArrayMixin(value, factoryOpt, keyPath, control) {
  var length;
  if (value == null) {
    value = [];
    length = factoryOpt.defaultLength;
  } else {
    // allow overriding of length
    length = value.length;
  }

  var elem = factoryOpt.elem;

  for (var i = 0; i < length; i++) {
    propContainerUtil.defineProperty(this, value, keyPath, control, elem, i);
  }

  Object.freeze(this);
}

var WrappedArray = inheritArray(WrappedArrayMixin);

function WrappedArrayFactory(opt) {
  if (! (this instanceof WrappedArrayFactory)) {
    return new WrappedArrayFactory(opt);
  }
  this.opt = (opt != null) ? opt : {};
}

WrappedArrayFactory.prototype.createInstance = function(value, keyPath, control) {
  if (keyPath == null) {
    keyPath = [];
  }
  if (control == null) {
    control = Control.default;
  }
  return WrappedArray(value, this.opt, keyPath, control);
};

WrappedArrayFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

WrappedArrayFactory.prototype.snapshot = function (mapper, instance, keyPath) {
  var res = [];
  for (var i = 0, length = instance.length; i < length; i++) {
    res[i] = snapshotUtil.overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
  }

  return res;
};

module.exports = WrappedArrayFactory;

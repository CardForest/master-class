'use strict';

var inheritArray = require('inherit-array');

var propContainerUtil = require('./propContainerUtil');
var Control = require('../control');

function WrappedArrayMixin(value, spec, keyPath, control) {
  var length;
  if (value == null) {
    value = [];
    length = spec.defaultLength;
  } else {
    // allow overriding of length
    length = value.length;
  }

  var elem = spec.elem;

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
    control = Control.noOp;
  }
  return WrappedArray(value, this.opt, keyPath, control);
};

WrappedArrayFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

module.exports = WrappedArrayFactory;

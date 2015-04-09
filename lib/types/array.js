'use strict';

var inheritArray = require('inherit-array');

var propContainerUtil = require('../util/propContainer');

function WrappedArrayMixin(value, spec, keyPath, control) {
  var length;
  if (value == null) {
    value = [];
    length = spec.defaultLength;
  } else {
    // allow overriding of length
    length = value.length;
  }

  var elemSpec = spec.elemSpec;

  for (var i = 0; i < length; i++) {
    propContainerUtil.defineProperty(this, value, keyPath, control, elemSpec, i);
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

WrappedArrayFactory.prototype.instantiate = function(value, keyPath, control) {
  return WrappedArray(value, this.opt, keyPath, control);
};

WrappedArrayFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;


module.exports = WrappedArrayFactory;

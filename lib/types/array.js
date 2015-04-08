'use strict';

var inheritArray = require('inherit-array');

var propContainerUtil = require('../util/propContainer');

function WrappedArray(value, spec, keyPath, control) {
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

var WrappedArrayFactory = inheritArray(WrappedArray);

WrappedArrayFactory.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

module.exports = WrappedArrayFactory;

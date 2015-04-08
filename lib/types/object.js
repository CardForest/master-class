'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('../util/propContainer');

function WrappedObject(value, spec, keyPath, control) {
  var self = this;

  if (value == null) {
    value = {};
  }

  forOwn(spec.propSpecs, function(propSpec, key) {
    propContainerUtil.defineProperty(self, value, keyPath, control, propSpec, key);
  });

  Object.freeze(this);
}

var WrappedObjectFactory = function (value, spec, keyPath, control) {
  return new WrappedObject(value, spec, keyPath, control);
};

WrappedObjectFactory.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

module.exports = WrappedObjectFactory;

'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('../util/propContainer');

function WrappedObject(value, spec, keyPath, control) {
  var self = this;

  if (value == null) {
    value = {};
  }

  forOwn(spec.props, function(propFactory, key) {
    propContainerUtil.defineProperty(self, value, keyPath, control, propFactory, key);
  });

  Object.freeze(this);
}

function WrappedObjectFactory(opt) {
  if (! (this instanceof WrappedObjectFactory)) {
    return new WrappedObjectFactory(opt);
  }
  this.opt = (opt != null) ? opt : {};
}

WrappedObjectFactory.prototype.instantiate = function(value, keyPath, control) {
  return new WrappedObject(value, this.opt, keyPath, control);
};

WrappedObjectFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

module.exports = WrappedObjectFactory;

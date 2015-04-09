'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('./propContainerUtil');
var Control = require('../control');

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

WrappedObjectFactory.prototype.createInstance = function(value, keyPath, control) {
  if (keyPath == null) {
    keyPath = [];
  }
  if (control == null) {
    control = Control.default;
  }

  return new WrappedObject(value, this.opt, keyPath, control);
};

WrappedObjectFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;

module.exports = WrappedObjectFactory;

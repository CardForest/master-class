'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

var Control = require('../control');

function WrappedObject(value, factoryOpt, keyPath, control, isRootObject, factory) {
  var self = this;

  if (! factoryOpt.hasOwnProperty('props')) {
    throw Error('object options in [' + keyPath + '] must include \'props\'')
  }
  if (isRootObject) {
    if (factoryOpt.props.hasOwnProperty('control')) {
      throw Error('\'control\' property is reserved in the root object')
    }

    Object.defineProperty(
      self,
      'control',
      {
        enumerable: false,
        configurable: false,
        value: control,
        writable: false
      }
    );

    if (factoryOpt.props.hasOwnProperty('snapshot')) {
      throw Error('\'snapshot\' property is reserved in the root object')
    }

    Object.defineProperty(
      self,
      'snapshot',
      {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (mapper) {
          if (mapper == null) {
            mapper = snapshotUtil.noOpMapper;
          }
          return factory.snapshot(mapper, self, keyPath);
        }
      }
    );
  }

  if (value == null) {
    value = {};
  }

  forOwn(factoryOpt.props, function(propFactory, key) {
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

WrappedObjectFactory.prototype.createInstance = function(value, keyPath, control, isRootObject) {
  if (keyPath == null) {
    keyPath = [];
  }
  if (control == null) {
    control = Control.default;
  }

  if (value != null && typeof value !== 'object') {
    // support overriding of object with new types from mappers
    return value;
  }

  return new WrappedObject(value, this.opt, keyPath, control, isRootObject, this);
};

WrappedObjectFactory.prototype.toPropertyDescriptor = propContainerUtil.toPropertyDescriptor;


WrappedObjectFactory.prototype.snapshot = function (mapper, instance, keyPath) {
  var self = this;
  var res = {};
  forOwn(instance, function(value, key) {
    res[key] = snapshotUtil.overridableSnapshot(self.opt.props[key], mapper, value, keyPath.concat(key));
  });

  return res;
};

module.exports = WrappedObjectFactory;

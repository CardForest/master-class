'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

var Control = require('../control');

function WrappedObject(value, factoryOpt, keyPath, control, isRootObject, factory) {
  var self = this;

  if (! factoryOpt.hasOwnProperty('props')) {
    throw Error('object options in [' + keyPath + '] must include \'props\'');
  }
  if (isRootObject) {
    if (factoryOpt.props.hasOwnProperty('control')) {
      throw Error('\'control\' property is reserved in the root object');
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
      throw Error('\'snapshot\' property is reserved in the root object');
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

    // TODO don't pollute the control object
    // (while still managing to pass reference of root object to sub factory)
    self.control.root = self;
  }

  if (value == null) {
    value = {};
  }

  if (factoryOpt.props.hasOwnProperty('keyPath')) {
    throw Error('\'keyPath\' property is reserved in objects');
  }

  Object.defineProperty(
    self,
    'keyPath',
    {
      enumerable: false,
      configurable: false,
      value: keyPath,
      writable: false
    }
  );

  if (factoryOpt.props.hasOwnProperty('root')) {
    // TODO move properties from control to root
    throw Error('\'root\' property is reserved in objects');
  }

  Object.defineProperty(
    self,
    'root',
    {
      enumerable: false,
      configurable: false,
      value: control.root,
      writable: false
    }
  );

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

WrappedObjectFactory.WrappedObject = WrappedObject;

module.exports = WrappedObjectFactory;

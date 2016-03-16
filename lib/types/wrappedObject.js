'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

module.exports = class WrappedObject {
  constructor(value, factoryOpt, keyPath, control, parent, factory) {
    if (!factoryOpt.hasOwnProperty('props')) {
      throw Error('object options in [' + keyPath + '] must include \'props\'');
    }
    if (parent == null) {
      // this -is- the root object

      //if (factoryOpt.props.hasOwnProperty('control')) {
      //  throw Error('\'control\' property is reserved in the root object');
      //}

      //Object.defineProperty(
      //  this,
      //  'control',
      //  {
      //    enumerable: false,
      //    configurable: false,
      //    value: control,
      //    writable: false
      //  }
      //);

      if (factoryOpt.props.hasOwnProperty('snapshot')) {
        throw Error('\'snapshot\' property is reserved in the root object');
      }

      Object.defineProperty(
        this,
        'snapshot',
        {
          enumerable: false,
          configurable: false,
          writable: false,
          value: (mapper) => {
            if (mapper == null) {
              mapper = snapshotUtil.noOpMapper;
            }
            return factory.snapshot(mapper, this, keyPath);
          }
        }
      );

      if (factoryOpt.props.hasOwnProperty('control')) {
        throw Error('\'control\' property is reserved in the root object');
      }

      Object.defineProperty(
        this,
        'control',
        {
          enumerable: false,
          configurable: false,
          writable: false,
          value: control
        }
      );
    }

    // setup ref to root object
    if (factoryOpt.props.hasOwnProperty(control.rootPropertyName)) {
      throw Error('\'' + control.rootPropertyName + '\' property is reserved in objects');
    }

    var root = (parent == null) ? this : (parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent);

    Object.defineProperty(
      this,
      control.rootPropertyName,
      {
        enumerable: false,
        configurable: false,
        value: root,
        writable: false
      }
    );


    if (value == null) {
      value = {};
    }

    if (factoryOpt.props.hasOwnProperty('keyPath')) {
      throw Error('\'keyPath\' property is reserved in objects');
    }

    Object.defineProperty(
      this,
      'keyPath',
      {
        enumerable: false,
        configurable: false,
        value: keyPath,
        writable: false
      }
    );

    forOwn(factoryOpt.props, (propFactory, key) => {
      propContainerUtil.defineProperty(this, value, keyPath, control, propFactory, key);
    });


    Object.freeze(this);
  }
};

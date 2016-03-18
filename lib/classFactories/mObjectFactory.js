'use strict';

const Control = require('../control');
const forOwn = require('lodash.forown');

const MObject = require('../classes/mObject');

const propContainerUtil = require('../types/propContainerUtil');
const snapshotUtil = require('../types/snapshotUtil');

module.exports = function mObjectFactory(opt) {
  if (!opt.hasOwnProperty('props')) {
    throw Error('object options must include \'props\'');
  }

  const props = opt.props;

  return class extends MObject {
    constructor(value, keyPath, control, parent) {
      super();

      if (keyPath == null) {
        keyPath = [];
      }
      if (control == null) {
        control = new Control();
      }

      if (value != null && value.hasOwnProperty('$override')) {
        // support overriding of object with new types from mappers
        return value;
      }

      if (parent == null) {
        // this is the root object
        if (props.hasOwnProperty('snapshot')) {
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
              return new.target.snapshot(mapper, this, keyPath);
            }
          }
        );

        if (props.hasOwnProperty('control')) {
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

        if (opt.hasOwnProperty('rootPropertyName')) {
          control.rootPropertyName = opt.rootPropertyName;
        }
      }

      // setup ref to root object
      if (props.hasOwnProperty(control.rootPropertyName)) {
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

      if (props.hasOwnProperty('keyPath')) {
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

      if (value == null) {
        value = {};
      }

      forOwn(props, (Class, key) => {
        propContainerUtil.defineProperty(this, value, keyPath, control, Class, key);
      });

      Object.freeze(this);
    }

    static createInstance(value, keyPath, control, parent) {
      return new this(value, keyPath, control, parent);
    }

    static snapshot(mapper, instance, keyPath) {
      var res = {};
      forOwn(instance, (value, key) => {
        const propSnapshot = snapshotUtil.overridableSnapshot(props[key], mapper, value, keyPath.concat(key));
        res[key] = (typeof value  === 'object' && typeof propSnapshot !== 'object') ?
        {$override: propSnapshot} : propSnapshot;

      });

      return res;
    }

    static getProps() {
      return props;
    }

    static get opt() {// TODO convert to 'static const' if/when it will be supported
      return opt;
    }

    static toPropertyDescriptor(value, control, keyPath, key, parent) {
      const self = this;
      return {
        enumerable: true,

        configurable: false,
        set(newValue) {
          if (!control.isChangeAllowed) {
            throw Error('change is not allowed in this context');
          }
          value = self.createInstance(newValue, keyPath.concat(key), control, parent);
          control.emit('change', 'setValue', {newValue: newValue, trgKeyPath: keyPath, key: key}, opt);
        },
        get() {
          return value;
        },
      };
    }
  };
};

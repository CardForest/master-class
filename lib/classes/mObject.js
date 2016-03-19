'use strict';

const Control = require('../control');
const forOwn = require('lodash.forown');
const overridableSnapshot = require('../utils/overridableSnapshot');

module.exports = class MObject {
  constructor(value, keyPath, control, parent) {
    const opt = this.constructor.opt;

    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

    if (parent == null) {
      // this is the root object
      if (opt.props.hasOwnProperty('snapshot')) {
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
              mapper = function noOpMapper(opt, instance, keyPath, snapshotFn) {
                return snapshotFn();
              };
            }
            return this.constructor.snapshot(mapper, this, keyPath);
          }
        }
      );

      if (opt.props.hasOwnProperty('control')) {
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
    if (opt.props.hasOwnProperty(control.rootPropertyName)) {
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

    if (opt.props.hasOwnProperty('keyPath')) {
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

    forOwn(opt.props, (Class, key) => {
      this.constructor.defineProperty(this, value, keyPath, control, Class, key);
    });

    Object.freeze(this);
  }

  static createInstance(value, keyPath, control, parent) {
    if (value != null && value.hasOwnProperty('$override')) {
      // support overriding of object with new utils from mappers
      return value;
    }

    return new this(value, keyPath, control, parent);
  }

  static snapshot(mapper, instance, keyPath) {
    var res = {};
    forOwn(instance, (value, key) => {
      const propSnapshot = overridableSnapshot(this.opt.props[key], mapper, value, keyPath.concat(key));
      res[key] = (typeof value  === 'object' && typeof propSnapshot !== 'object') ?
      {$override: propSnapshot} : propSnapshot;

    });

    return res;
  }

  static toPropertyDescriptor(value, control, keyPath, key, parent) {
    return {
      enumerable: true,
      configurable: false,
      set: (newValue) => {
        if (!control.isChangeAllowed) {
          throw Error('change is not allowed in this context');
        }
        value = this.createInstance(newValue, keyPath.concat(key), control, parent);
        control.emit('change', 'setValue', {newValue: newValue, trgKeyPath: keyPath, key: key}, this.opt);
      },
      get() {
        return value;
      },
    };
  }

  static defineProperty(self, value, keyPath, control, propFactory, key) {
    if ((typeof propFactory !== 'object' && typeof propFactory !== 'function') || ! ('createInstance' in propFactory)) {
      throw Error('element in [' + keyPath.concat(key) + '] does not have a valid type');
    }
    if (value[key] !== '$hidden') {
      value = propFactory.createInstance(value[key], keyPath.concat(key), control, self);

      Object.defineProperty(
        self,
        key,
        propFactory.toPropertyDescriptor(
          value,
          control,
          keyPath,
          key,
          self
        )
      );
    }
  }

  static get props() {return this.opt.props;}
};

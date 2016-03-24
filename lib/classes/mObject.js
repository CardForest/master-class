'use strict';

const Control = require('../utils/control');
const forOwn = require('lodash.forown');
const overridableSnapshot = require('../utils/overridableSnapshot');

module.exports = class MObject {
  static handleRootObject(target, value, keyPath, control, parent) {
    const isRoot = parent == null;
    if (isRoot) {
      // this is the root object

      // allow passing of control overrides in root second parameter
      if (keyPath instanceof Control) {
        control = keyPath;
      } else {
        control = new Control(keyPath);
      }

      keyPath = [];

      Object.defineProperty(
        target,
        'snapshot',
        {
          enumerable: false,
          configurable: false,
          writable: false,
          value: (mapper) => {
            if (mapper == null) {
              mapper = function noOpMapper(_1, _2, _3, snapshotFn) {
                return snapshotFn();
              };
            }
            return this.snapshot(mapper, target, keyPath);
          }
        }
      );

      Object.defineProperty(
        target,
        'control',
        {
          enumerable: false,
          configurable: false,
          writable: false,
          value: control
        }
      );

      if (this.opt.hasOwnProperty('rootPropertyName')) {
        control.rootPropertyName = this.opt.rootPropertyName;
      }
    }
    return {isRoot, keyPath, control};
  }

  constructor(value, _keyPath, _control, parent) {
    const handleRootObjectResponse = this.constructor.handleRootObject(this, value, _keyPath, _control, parent);
    // TODO replace this destructuring when available
    const isRoot = handleRootObjectResponse.isRoot,
          keyPath = handleRootObjectResponse.keyPath,
          control = handleRootObjectResponse.control;

    const opt = this.constructor.opt;

    if (isRoot) {
      if (opt.props.hasOwnProperty('snapshot')) {
        throw Error('\'snapshot\' property is reserved in the root objects');
      }

      if (opt.props.hasOwnProperty('control')) {
        throw Error('\'control\' property is reserved in the root objects');
      }
    }

    // setup ref to root object
    if (opt.props.hasOwnProperty(control.rootPropertyName)) {
      throw Error('\'' + control.rootPropertyName + '\' property is reserved in objects');
    }

    const root = isRoot ? this : (parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent);

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

    if (!isRoot) {
      Object.defineProperty(
        this,
        'parent',
        {
          enumerable: false,
          configurable: false,
          value: parent,
          writable: false
        }
      );
    }

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

    if (isRoot) {
      control.emit('change');
    }
  }

  static createInstance(value, keyPath, control, parent) {
    if (value != null && typeof value !== 'object') {
      // support overriding of object with new utils from mappers
      return value;
    }

    return new this(value, keyPath, control, parent);
  }

  static snapshot(mapper, instance, keyPath) {
    if (typeof instance !== 'object') {
      // we're currently allowing object to be overridden by other values
      return instance;
    }
    const res = {};
    forOwn(instance, (value, key) => {
      res[key] = overridableSnapshot(this.opt.props[key], mapper, value, keyPath.concat(key));
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
    if ((typeof propFactory !== 'object' && typeof propFactory !== 'function') || !('createInstance' in propFactory)) {
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

  static get props() {
    return this.opt.props;
  }
};

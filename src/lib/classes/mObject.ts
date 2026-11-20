import Control = require('../utils/control');
import overridableSnapshot = require('../utils/overridableSnapshot');
import {
  isFactory, isRecord, rootOf,
  type ControlOptions, type Factory, type KeyPath, type ObjectOptions, type SnapshotMapper
} from '../../types';

interface ConstructableFactory extends Factory {
  new(value?: unknown, keyPath?: KeyPath | Control | ControlOptions, control?: Control, parent?: object): object;
}

class MObject {
  declare readonly keyPath: KeyPath;
  declare readonly control: Control;
  declare readonly root: object;
  declare readonly parent?: object;
  declare snapshot: (mapper?: SnapshotMapper) => unknown;
  [key: string]: unknown;

  static get opt(): ObjectOptions {
    throw new Error('MObject requires factory options');
  }

  static handleRootObject(
    this: ConstructableFactory, target: object, _value: unknown,
    keyPath: KeyPath | Control | ControlOptions | undefined, control: Control | undefined, parent?: object
  ): { isRoot: boolean; keyPath: KeyPath; control: Control } {
    const isRoot = parent == null;
    if (isRoot) {
      control = keyPath instanceof Control ? keyPath : new Control(keyPath as ControlOptions | undefined);
      keyPath = [];
      Object.defineProperty(target, 'snapshot', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: (mapper: SnapshotMapper = (_opt, _instance, _path, snapshotFn) => snapshotFn()) => {
          if (!this.snapshot) {
            throw new TypeError('factory does not support snapshots');
          }
          return this.snapshot(mapper, target, keyPath as KeyPath);
        }
      });
      Object.defineProperty(target, 'control', {
        enumerable: false, configurable: false, writable: false, value: control
      });
      if (isRecord(this.opt) && Object.hasOwn(this.opt, 'rootPropertyName')) {
        control.rootPropertyName = this.opt.rootPropertyName as string;
      }
    }
    if (!Array.isArray(keyPath) || !control) {
      throw new TypeError('nested objects require a key path and control');
    }
    return { isRoot, keyPath, control };
  }

  constructor(value?: unknown, _keyPath?: KeyPath | Control | ControlOptions, _control?: Control, parent?: object) {
    const Class = this.constructor as typeof MObject;
    const { isRoot, keyPath, control } = Class.handleRootObject(this, value, _keyPath, _control, parent);
    const opt = Class.opt;
    if (isRoot) {
      if (Object.hasOwn(opt.props, 'snapshot')) {
        throw new Error("'snapshot' property is reserved in the root objects");
      }
      if (Object.hasOwn(opt.props, 'control')) {
        throw new Error("'control' property is reserved in the root objects");
      }
    }
    if (Object.hasOwn(opt.props, control.rootPropertyName)) {
      throw new Error("'" + control.rootPropertyName + "' property is reserved in objects");
    }
    Object.defineProperty(this, control.rootPropertyName, {
      enumerable: false, configurable: false, value: rootOf(parent, this, control), writable: false
    });
    if (!isRoot) {
      Object.defineProperty(this, 'parent', {
        enumerable: false, configurable: false, value: parent, writable: false
      });
    }
    if (Object.hasOwn(opt.props, 'keyPath')) {
      throw new Error("'keyPath' property is reserved in objects");
    }
    Object.defineProperty(this, 'keyPath', {
      enumerable: false, configurable: false, value: keyPath, writable: false
    });
    const initialValue = value == null ? {} : Object(value) as Record<string, unknown>;
    Object.entries(opt.props).forEach(([key, factory]) => {
      Class.defineProperty(this, initialValue, keyPath, control, factory, key);
    });
    Object.freeze(this);
    if (isRoot) {
      control.emit('change');
    }
  }

  static createInstance(
    this: ConstructableFactory, value?: unknown, keyPath?: KeyPath | Control | ControlOptions, control?: Control, parent?: object
  ): unknown {
    if (value != null && typeof value !== 'object') {
      // Snapshot mappers may replace objects with primitive values.
      return value;
    }
    return new this(value, keyPath, control, parent);
  }

  static snapshot(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown {
    if (!isRecord(instance)) {
      return instance;
    }
    const res: Record<string, unknown> = {};
    Object.entries(instance).forEach(([key, value]) => {
      res[key] = overridableSnapshot(this.opt.props[key]!, mapper, value, keyPath.concat(key));
    });
    return res;
  }

  static toPropertyDescriptor(
    this: Factory, value: unknown, control: Control, keyPath: KeyPath, key: string | number, parent: object
  ): PropertyDescriptor {
    return {
      enumerable: true,
      configurable: false,
      set: (newValue: unknown) => {
        if (!control.isChangeAllowed) {
          throw new Error('change is not allowed in this context');
        }
        value = this.createInstance(newValue, keyPath.concat(key), control, parent);
        control.emit('change', 'setValue', { newValue, trgKeyPath: keyPath, key }, this.opt);
      },
      get() {
        return value;
      }
    };
  }

  static defineProperty(
    self: object, value: Record<string, unknown> | unknown[], keyPath: KeyPath,
    control: Control, propFactory: unknown, key: string | number
  ): void {
    if (!isFactory(propFactory)) {
      throw new Error('element in [' + keyPath.concat(key) + '] does not have a valid type');
    }
    const initialValue: unknown = Reflect.get(value, key);
    if (initialValue !== '$hidden') {
      const instance = propFactory.createInstance(initialValue, keyPath.concat(key), control, self);
      Object.defineProperty(self, key, propFactory.toPropertyDescriptor(instance, control, keyPath, key, self));
    }
  }

  static get props(): Record<string, Factory> {
    return this.opt.props;
  }
}

export = MObject;

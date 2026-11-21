import overridableSnapshot = require('../utils/overridableSnapshot');
import Control = require('../utils/control');
import MObject = require('./mObject');
import { RestoredModel, trackModel, writeProperty } from '../utils/modelData';
import { rootOf, type ArrayOptions, type ControlOptions, type KeyPath, type Managed, type SnapshotMapper } from '../../types';

class MArray extends Array<unknown> {
  static readonly modelKind = 'array';
  static createInstance = MObject.createInstance;
  static toPropertyDescriptor = MObject.toPropertyDescriptor;
  static defineProperty = MObject.defineProperty;
  static deserialize = MObject.deserialize;
  declare readonly control: Control;
  declare readonly keyPath: KeyPath;
  declare readonly export: Managed['export'];
  declare readonly serialize: Managed['serialize'];
  declare readonly snapshot: Managed['snapshot'];

  static get opt(): ArrayOptions {
    throw new Error('MArray requires factory options');
  }

  constructor(value?: unknown, location?: KeyPath | Control | ControlOptions, owner?: Control, parent?: object) {
    super();
    const Class = this.constructor as typeof MArray;
    const { isRoot, keyPath, control } = MObject.handleRootObject.call(Class, this, value, location, owner, parent);
    const opt = Class.opt;
    Object.defineProperty(this, control.rootPropertyName, {
      enumerable: false, configurable: false, value: rootOf(parent, this, control), writable: false
    });
    Object.defineProperty(this, 'keyPath', { value: keyPath });
    const restored = RestoredModel.forKind(value, 'array');
    const initialValue = restored?.fields ?? (value == null ? [] : Object(value) as unknown[]);
    const length = restored ? restored.length! : value == null ? opt.defaultLength : (initialValue as unknown[]).length;
    this.length = length;
    restored?.register(this);
    trackModel(this, 'array', (write) => {
      const fields: Record<string, ReturnType<typeof write>> = {};
      for (let i = 0; i < this.length; i++) fields[i] = writeProperty(write, this, i, opt.elem);
      return fields;
    }, this.length);
    try {
      if (restored) {
        if (Object.keys(restored.fields).length !== length) throw new TypeError('serialized array has missing fields');
        for (const key of Object.keys(restored.fields)) {
          Class.defineProperty(this, initialValue, keyPath, control, opt.elem, Number(key), true);
        }
      } else {
        for (let i = 0; i < length; i++) {
          Class.defineProperty(this, initialValue, keyPath, control, opt.elem, i);
        }
      }
      Object.freeze(this);
      if (isRoot) control.emit('change');
    } catch (error) {
      control.dispose(this);
      throw error;
    }
  }

  static get [Symbol.species](): ArrayConstructor {
    return Array;
  }

  static snapshot(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown {
    if (instance === null || typeof instance !== 'object') return instance;
    if (!Array.isArray(instance)) {
      throw new TypeError('expected array');
    }
    const res: unknown[] = new Array(instance.length);
    for (let i = 0; i < instance.length; i++) {
      if (Object.prototype.propertyIsEnumerable.call(instance, i)) {
        res[i] = overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
      }
    }
    return res;
  }
}

export = MArray;

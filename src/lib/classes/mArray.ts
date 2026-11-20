import overridableSnapshot = require('../utils/overridableSnapshot');
import Control = require('../utils/control');
import MObject = require('./mObject');
import { rootOf, type ArrayOptions, type KeyPath, type SnapshotMapper } from '../../types';

class MArray extends Array<unknown> {
  static createInstance = MObject.createInstance;
  static toPropertyDescriptor = MObject.toPropertyDescriptor;
  static defineProperty = MObject.defineProperty;

  static get opt(): ArrayOptions {
    throw new Error('MArray requires factory options');
  }

  constructor(value?: unknown, keyPath?: KeyPath | null, control?: Control | null, parent?: object) {
    super();
    keyPath ??= [];
    control ??= new Control();
    const Class = this.constructor as typeof MArray;
    const opt = Class.opt;
    Object.defineProperty(this, control.rootPropertyName, {
      enumerable: false, configurable: false, value: rootOf(parent, this, control), writable: false
    });
    const initialValue = value == null ? [] : Object(value) as unknown[];
    const length = value == null ? opt.defaultLength : initialValue.length;
    this.length = length;
    for (let i = 0; i < length; i++) {
      Class.defineProperty(this, initialValue, keyPath, control, opt.elem, i);
    }
    Object.freeze(this);
  }

  static get [Symbol.species](): ArrayConstructor {
    return Array;
  }

  static snapshot(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown[] {
    if (!Array.isArray(instance)) {
      throw new TypeError('expected array');
    }
    const res: unknown[] = [];
    for (let i = 0; i < instance.length; i++) {
      res[i] = overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
    }
    return res;
  }
}

export = MArray;

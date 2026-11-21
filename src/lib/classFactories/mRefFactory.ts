import KeyPath = require('key-path');
import MObject = require('../classes/mObject');
import { RestoredReference } from '../utils/modelData';
import { isRecord, type ReferenceValue, type RefFactory } from '../../types';

function mRefFactory(options?: Record<string, unknown> | null): RefFactory {
  const opt = options ?? {};
  return {
    opt,
    isReference: true,
    createInstance(value) {
      if (value == null) return { ref: null };
      if (value instanceof RestoredReference) {
        let resolve: (() => object) | undefined = value.target;
        let assigned: object | null = null;
        return {
          get ref() { return resolve ? resolve() : assigned; },
          set ref(ref) { resolve = undefined; assigned = ref ?? null; }
        };
      }
      const reference = value as ReferenceValue;
      return reference.keyPath === undefined
        ? { ...reference }
        : { ...reference, keyPath: reference.keyPath.slice() };
    },
    toPropertyDescriptor(initialValue, control, keyPath, key) {
      const value = initialValue as ReferenceValue;
      return {
        enumerable: true,
        configurable: false,
        get(this: Record<string, unknown>) {
          if (Object.hasOwn(value, 'keyPath')) {
            const root = this[control.rootPropertyName];
            if (!isRecord(root)) {
              throw new TypeError('expected root object');
            }
            value.ref = KeyPath.get(value.keyPath!).getValueFrom(root) as object | null;
            delete value.keyPath;
          }
          return value.ref;
        },
        set(newValue: unknown) {
          if (!control.isChangeAllowed) {
            throw new Error('change is not allowed in this context');
          }
          if (newValue !== null && !(newValue instanceof MObject)) {
            throw new TypeError('expected MObject');
          }
          delete value.keyPath;
          value.ref = newValue;
          control.emit('change', 'setValue', {
            newValue: newValue === null ? null : { keyPath: newValue.keyPath.slice() }, trgKeyPath: keyPath, key
          }, opt);
        }
      };
    },
    snapshot(_mapper, instance) {
      return instance != null ? { keyPath: (instance as MObject).keyPath.slice() } : null;
    }
  };
}

export = mRefFactory;

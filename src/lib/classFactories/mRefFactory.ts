import KeyPath = require('key-path');
import MObject = require('../classes/mObject');
import { isRecord, type ReferenceValue, type RefFactory } from '../../types';

function mRefFactory(options?: Record<string, unknown> | null): RefFactory {
  const opt = options ?? {};
  return {
    opt,
    isReference: true,
    createInstance(value) {
      return value == null ? { ref: null } : value as ReferenceValue;
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
          if (!(newValue instanceof MObject)) {
            throw new TypeError('expected MObject');
          }
          value.ref = newValue;
          control.emit('change', 'setValue', {
            newValue: { keyPath: newValue.keyPath }, trgKeyPath: keyPath, key
          }, opt);
        }
      };
    },
    snapshot(_mapper, instance) {
      return instance != null ? { keyPath: (instance as MObject).keyPath } : null;
    }
  };
}

export = mRefFactory;

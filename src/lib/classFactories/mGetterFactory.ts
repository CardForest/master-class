import makeReadOnlyFn = require('../utils/makeReadOnlyFn');
import type { GetterFactory } from '../../types';

function mGetterFactory<T, R>(getter: (this: T) => R): GetterFactory<T, R> {
  if (typeof getter !== 'function') {
    throw new TypeError('expected function');
  }
  return {
    isGetter: true,
    createInstance() {
      return getter;
    },
    toPropertyDescriptor(_value, control) {
      return {
        enumerable: false,
        configurable: false,
        get: makeReadOnlyFn(getter, control)
      };
    }
  };
}

export = mGetterFactory;

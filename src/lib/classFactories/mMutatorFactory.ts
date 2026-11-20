import makeReadOnlyFn = require('../utils/makeReadOnlyFn');
import type { Factory, KeyPath, MutatorOptions } from '../../types';

function mMutatorFactory<T, A extends unknown[], R>(
  options: ((this: T, ...args: A) => R) | MutatorOptions<(this: T, ...args: A) => R, T>
): Factory<(this: T, ...args: A) => R> & { readonly opt: MutatorOptions<(this: T, ...args: A) => R, T> } {
  const opt = typeof options === 'function' ? { fn: options } : options;
  if (typeof opt.fn !== 'function') {
    throw new TypeError('expected function');
  }

  return {
    opt,
    createInstance(_value, keyPath = [], control, parent) {
      if (!control) {
        throw new TypeError('mutators require a control');
      }
      const originMutatorFn = opt.fn;
      const mutatorFn = function (this: T, ...args: A) {
        const onMutatorCall: (this: T, keyPath: KeyPath, args: A, mutator: (this: T, ...args: A) => R) => R =
          control.onMutatorCall;
        return onMutatorCall.call(this, keyPath, args, originMutatorFn);
      };

      if (Object.hasOwn(opt, 'guard')) {
        const guard = makeReadOnlyFn(opt.guard!, control);
        const fn = function (this: T, ...args: A) {
          if (guard.call(this) === true) {
            return mutatorFn.apply(this, args);
          }
          throw new Error('mutator blocked by guard');
        };
        Object.defineProperty(fn, 'guard', {
          enumerable: false,
          configurable: false,
          get: () => Reflect.apply(guard, parent, []) as boolean
        });
        return fn;
      }
      return mutatorFn;
    },
    toPropertyDescriptor(mutator) {
      return {
        enumerable: false,
        configurable: false,
        value: mutator,
        writable: false
      };
    }
  };
}

export = mMutatorFactory;

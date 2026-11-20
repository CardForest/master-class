import type { Factory, PrimitiveOptions } from '../../types';

function mPrimitiveFactoryFactory<T extends number | string | boolean>(
  primitive: { (value?: unknown): T; readonly name: string }
): (opt?: PrimitiveOptions<T> | null) => Factory<T> & { readonly opt: PrimitiveOptions<T> } {
  const primitiveTypeName = primitive.name.toLowerCase();

  return function (options) {
    const opt = options ?? {};
    if (Object.hasOwn(opt, 'initialValue') && typeof opt.initialValue !== primitiveTypeName) {
      throw new TypeError('expected ' + primitiveTypeName);
    }

    return {
      opt,
      createInstance(value) {
        if (value == null) {
          value = opt.initialValue;
        }
        if (value == null) {
          return primitive();
        }
        if (typeof value !== primitiveTypeName) {
          throw new TypeError('expected ' + primitiveTypeName);
        }
        return primitive(value);
      },
      toPropertyDescriptor(value, control, keyPath, key) {
        return {
          enumerable: true,
          configurable: false,
          get() {
            return value;
          },
          set(newValue: unknown) {
            if (!control.isChangeAllowed) {
              throw new Error('change is not allowed in this context');
            }
            if (typeof newValue !== primitiveTypeName) {
              throw new TypeError('expected ' + primitiveTypeName);
            }
            value = newValue;
            control.emit('change', 'setValue', { newValue, trgKeyPath: keyPath, key }, opt);
          }
        };
      },
      snapshot(_mapper, instance) {
        return instance;
      }
    };
  };
}

export = mPrimitiveFactoryFactory;

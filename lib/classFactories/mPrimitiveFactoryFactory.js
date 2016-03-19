'use strict';

module.exports = function mPrimitiveFactoryFactory(primitive) {
  const primitiveTypeName = primitive.name.toLowerCase();

  return function (opt) {
    opt = (opt != null) ? opt : {};

    if (opt.hasOwnProperty('initialValue') && typeof opt.initialValue !== primitiveTypeName) {
      throw TypeError('expected ' + primitiveTypeName);
    }

    return {
      opt,

      createInstance(value) {
        if (value == null) {
          value = opt.initialValue;
        }
        if (value == null) {
          return primitive();
        } else if (typeof value !== primitiveTypeName) {
          throw TypeError('expected ' + primitiveTypeName);
        } else {
          return primitive(value);
        }
      },

      toPropertyDescriptor(value, control, keyPath, key) {
        return {
          enumerable: true,
          configurable: false,
          get: function () {
            return value;
          },
          set: (newValue) => {
            if (!control.isChangeAllowed) {
              throw Error('change is not allowed in this context');
            }
            if (typeof newValue !== primitiveTypeName) {
              throw TypeError('expected ' + primitiveTypeName);
            }
            value = newValue;
            control.emit('change', 'setValue', {newValue: newValue, trgKeyPath: keyPath, key: key}, opt);
          }
        };
      },

      snapshot(mapper, instance) {
        return instance;
      }
    };
  };
};

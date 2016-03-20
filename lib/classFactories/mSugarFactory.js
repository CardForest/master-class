'use strict';

const mObjectFactory = require('./mObjectFactory');
const mPrimitiveFactoryFactory = require('./mPrimitiveFactoryFactory');
const mNumberFactory = mPrimitiveFactoryFactory(Number);
const mStringFactory = mPrimitiveFactoryFactory(String);
const mBooleanFactory = mPrimitiveFactoryFactory(Boolean);
const mArrayFactory = require('./mArrayFactory');
const mGetterFactory = require('./mGetterFactory');
const mMutatorFactory = require('./mMutatorFactory');

function mSugarFactory(opt) {
  switch (typeof opt) {
    case 'object':
      if (opt.hasOwnProperty('createInstance')) {
        // already a class
        return opt;
      }
      if (Array.isArray(opt)) {
        return mArrayFactory({elem: mSugarFactory(opt[0]), defaultLength: 1});
      }

      const sugarProps = opt.hasOwnProperty('props') ? opt.props : opt;
      const keys = Object.getOwnPropertyNames(sugarProps);
      opt.props = {};
      keys.forEach((key) => {
        const propertyDescriptor = Object.getOwnPropertyDescriptor(sugarProps, key);
        if (propertyDescriptor.hasOwnProperty('get')) {
          opt.props[key] = mGetterFactory(propertyDescriptor.get);
        } else {
          opt.props[key] = mSugarFactory(propertyDescriptor.value);
        }
      });
      return mObjectFactory(opt);
    case 'function':
      switch (opt.name) {
        case 'Number':
          return mNumberFactory();
        case 'Boolean':
          return mBooleanFactory();
        case 'String':
          return mStringFactory();
        default: {
          return ('createInstance' in opt) ? opt : mMutatorFactory(opt);
        }
      } // jshint ignore:line
    case 'number':
      return mNumberFactory({initialValue: opt});
    case 'string':
      return mStringFactory({initialValue: opt});
    case 'boolean':
      return mBooleanFactory({initialValue: opt});

  }
}

mSugarFactory.Object = mObjectFactory;
mSugarFactory.Array = mArrayFactory;
mSugarFactory.State = require('./mStateFactory');

mSugarFactory.Number = mNumberFactory;
mSugarFactory.String = mStringFactory;
mSugarFactory.Boolean = mBooleanFactory;

mSugarFactory.Getter = mGetterFactory;
mSugarFactory.Mutator = mMutatorFactory;
mSugarFactory.Ref = require('./mRefFactory');

mSugarFactory.Sugar = mSugarFactory;

module.exports = mSugarFactory;

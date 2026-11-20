import mObjectFactory = require('./mObjectFactory');
import mPrimitiveFactoryFactory = require('./mPrimitiveFactoryFactory');
import mArrayFactory = require('./mArrayFactory');
import mGetterFactory = require('./mGetterFactory');
import mMutatorFactory = require('./mMutatorFactory');
import mStateFactory = require('./mStateFactory');
import mRefFactory = require('./mRefFactory');
import {
  isFactory, isRecord,
  type Factory, type Managed, type ObjectOptions, type SugarFactory, type SugarValue, type ModelFunction
} from '../../types';

const mNumberFactory = mPrimitiveFactoryFactory(Number);
const mStringFactory = mPrimitiveFactoryFactory(String);
const mBooleanFactory = mPrimitiveFactoryFactory(Boolean);

function mSugarFactory<S>(opt: S & ThisType<SugarValue<S> & Managed>): SugarFactory<S>;
function mSugarFactory(opt: unknown): Factory {
  return buildFactory(opt);
}

function buildFactory(opt: unknown): Factory {
  switch (typeof opt) {
    case 'object': {
      if (isFactory(opt)) {
        return opt;
      }
      if (Array.isArray(opt)) {
        return mArrayFactory({ elem: buildFactory(opt[0]), defaultLength: 1 });
      }
      if (!isRecord(opt)) {
        throw new TypeError('expected a schema');
      }
      let sugarProps: Record<string, unknown>;
      let options: ObjectOptions;
      if (Object.hasOwn(opt, 'props')) {
        if (!isRecord(opt.props)) {
          throw new TypeError('expected object properties');
        }
        sugarProps = opt.props;
        opt.props = {};
        options = opt as ObjectOptions;
      } else {
        sugarProps = opt;
        options = { props: {} };
      }
      Object.getOwnPropertyNames(sugarProps).forEach((key) => {
        if (key[0] === '$') {
          options[key.slice(1)] = sugarProps[key];
          return;
        }
        const descriptor = Object.getOwnPropertyDescriptor(sugarProps, key)!;
        if (Object.hasOwn(descriptor, 'get')) {
          options.props[key] = mGetterFactory(descriptor.get!);
        } else {
          options.props[key] = buildFactory(descriptor.value as unknown);
        }
      });
      return mObjectFactory(options);
    }
    case 'function':
      switch (opt.name) {
        case 'Number': return mNumberFactory();
        case 'Boolean': return mBooleanFactory();
        case 'String': return mStringFactory();
        default:
          return isFactory(opt) ? opt : mMutatorFactory(opt as ModelFunction);
      }
    case 'number': return mNumberFactory({ initialValue: opt });
    case 'string': return mStringFactory({ initialValue: opt });
    case 'boolean': return mBooleanFactory({ initialValue: opt });
    default: throw new TypeError('expected a schema');
  }
}

namespace mSugarFactory {
  export const Object = mObjectFactory;
  export const Array = mArrayFactory;
  export const State = mStateFactory;
  export const Number = mNumberFactory;
  export const String = mStringFactory;
  export const Boolean = mBooleanFactory;
  export const Getter = mGetterFactory;
  export const Mutator = mMutatorFactory;
  export const Ref = mRefFactory;
  export const Sugar = mSugarFactory;
}

export = mSugarFactory;

'use strict';

const MObject = require('../classes/mObject');

function mObjectFactory(opt) {
  if (!opt.hasOwnProperty('props')) {
    throw Error('object options must include \'props\'');
  }

  return class extends MObject {
    constructor(value, keyPath, control, parent) {
      super(value, keyPath, control, parent);
    }
    
    static get opt() {return opt;}
  };
}

mObjectFactory.Object = mObjectFactory;
mObjectFactory.Array = require('./mArrayFactory');
mObjectFactory.State = require('./mStateFactory');

const mPrimitiveFactoryFactory = require('./mPrimitiveFactoryFactory');
mObjectFactory.Number = mPrimitiveFactoryFactory(Number);
mObjectFactory.String = mPrimitiveFactoryFactory(String);
mObjectFactory.Boolean = mPrimitiveFactoryFactory(Boolean);

mObjectFactory.Getter = require('./mGetterFactory');
mObjectFactory.Mutator = require('./mMutatorFactory');
mObjectFactory.Ref = require('./mRefFactory');

module.exports = mObjectFactory;

'use strict';

var Control = require('./control');

var mObjectFactory = require('./classFactories/mObjectFactory');
var mPrimitiveFactoryFactory = require('./classFactories/mPrimitiveFactoryFactory');

class MasterClass {
 constructor(opt) {
  this.opt = (opt != null) ? opt : {};
  }

  createInstance(snapshot) {
    const obj = mObjectFactory(this.opt).createInstance(snapshot, [], new Control());
    obj.control.emit('instance created');
    return obj;
  }
}

function MasterClassFactory(opt) {
  return new MasterClass(opt);
}

MasterClassFactory.Object = mObjectFactory;
MasterClassFactory.Array = require('./classFactories/mArrayFactory');
MasterClassFactory.Number = mPrimitiveFactoryFactory(Number);
MasterClassFactory.String = mPrimitiveFactoryFactory(String);
MasterClassFactory.Boolean = mPrimitiveFactoryFactory(Boolean);
MasterClassFactory.Getter = require('./classFactories/mGetterFactory');
MasterClassFactory.Mutator = require('./classFactories/mMutatorFactory');
MasterClassFactory.Ref = require('./classFactories/mRefFactory');
MasterClassFactory.State = require('./classFactories/mStateFactory');

module.exports = MasterClassFactory;

'use strict';

var WrappedObjectFactory = require('./classFactories/mObjectFactory');
var Control = require('./control');

var primitives = require('./types/primitives');

class MasterClass {
 constructor(opt) {
  this.opt = (opt != null) ? opt : {};
  }

  createInstance(snapshot) {
    const obj = WrappedObjectFactory(this.opt).createInstance(snapshot, [], new Control());
    obj.control.emit('instance created');
    return obj;
  }
}

function MasterClassFactory(opt) {
  return new MasterClass(opt);
}

MasterClassFactory.Object = WrappedObjectFactory;
MasterClassFactory.Array = require('./classFactories/mArrayFactory');
MasterClassFactory.Number = primitives.Number;
MasterClassFactory.String = primitives.String;
MasterClassFactory.Boolean = primitives.Boolean;
MasterClassFactory.Getter = require('./types/getter');
MasterClassFactory.Mutator = require('./types/mutator');
MasterClassFactory.Ref = require('./types/ref');

MasterClassFactory.State = require('./types/state');

module.exports = MasterClassFactory;

'use strict';

var WrappedObjectFactory = require('./types/object');
var Control = require('./control');

var defaults = require('lodash.defaults');

var primitives = require('./types/primitives');

class MasterClass {
 constructor(opt) {
  this.opt = (opt != null) ? opt : {};
  }

  createInstance(snapshot, control) {
    return WrappedObjectFactory(this.opt).createInstance(snapshot, [], defaults(control || {}, Control.default));
  }
}

function MasterClassFactory(opt) {
  return new MasterClass(opt);
}

MasterClassFactory.Object = WrappedObjectFactory;
MasterClassFactory.Array = require('./types/array');
MasterClassFactory.Number = primitives.Number;
MasterClassFactory.String = primitives.String;
MasterClassFactory.Boolean = primitives.Boolean;
MasterClassFactory.Getter = require('./types/getter');
MasterClassFactory.Mutator = require('./types/mutator');
MasterClassFactory.Ref = require('./types/ref');

module.exports = MasterClassFactory;

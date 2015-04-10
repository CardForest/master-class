'use strict';

var WrappedObject = require('./types/object');
var Control = require('./control');

function MasterClass(opt) {
  if (! (this instanceof MasterClass)) {
    return new MasterClass(opt);
  }
  this.opt = (opt != null) ? opt : {};
}

MasterClass.prototype.createInstance = function(snapshot) {
  return WrappedObject(this.opt).createInstance(snapshot, [], Control.default, true);
};

var primitives = require('./types/primitives');

MasterClass.Object = WrappedObject;
MasterClass.Array = require('./types/array');
MasterClass.Number = primitives.Number;
MasterClass.String = primitives.String;
MasterClass.Boolean = primitives.Boolean;
MasterClass.Getter = require('./types/getter');
MasterClass.Mutator = require('./types/mutator');

module.exports = MasterClass;

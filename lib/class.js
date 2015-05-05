'use strict';

var WrappedObject = require('./types/object');
var Control = require('./control');

var defaults = require('lodash.defaults');

function MasterClass(opt) {
  if (! (this instanceof MasterClass)) {
    return new MasterClass(opt);
  }
  this.opt = (opt != null) ? opt : {};
}

MasterClass.prototype.createInstance = function(snapshot, control) {
  return WrappedObject(this.opt).createInstance(snapshot, [], defaults({}, control, Control.default));
};

var primitives = require('./types/primitives');

MasterClass.Object = WrappedObject;
MasterClass.Array = require('./types/array');
MasterClass.Number = primitives.Number;
MasterClass.String = primitives.String;
MasterClass.Boolean = primitives.Boolean;
MasterClass.Getter = require('./types/getter');
MasterClass.Mutator = require('./types/mutator');
MasterClass.Ref = require('./types/ref');

module.exports = MasterClass;

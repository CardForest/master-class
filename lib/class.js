'use strict';

var WrappedObject = require('./types/object');

function MasterClass(opt) {
  if (! (this instanceof MasterClass)) {
    return new MasterClass(opt);
  }
  this.opt = (opt != null) ? opt : {};
}

MasterClass.prototype.createInstance = function() {
  return WrappedObject(this.opt).createInstance(
                                            undefined, [], {
                                              set: function (cb) {
                                                cb();
                                              }
                                            });
};

var primitives = require('./types/primitives');

MasterClass.Object = WrappedObject;
MasterClass.Array = require('./types/array');
MasterClass.Number = primitives.Number;
MasterClass.String = primitives.String;
MasterClass.Boolean = primitives.Boolean;

module.exports = MasterClass;

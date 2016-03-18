'use strict';

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

var Control = require('../control');

class WrappedArray extends Array {
  constructor(value, factoryOpt, keyPath, control, parent) {
    super();

    var length;
    if (value == null) {
      value = [];
      length = factoryOpt.defaultLength;
    } else {
      // allow overriding of length
      length = value.length;
    }
    this.length = length; // make sure this array has the correct length even if it has undefined elements

    if (parent != null) {
      // this is -not- a root object
      // TODO avoid repeating code shared between array and object wrappers
      var root = parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent;

      Object.defineProperty(
        this,
        control.rootPropertyName,
        {
          enumerable: false,
          configurable: false,
          value: root,
          writable: false
        }
      );
    }

    var elem = factoryOpt.elem;

    for (var i = 0; i < length; i++) {
      propContainerUtil.defineProperty(this, value, keyPath, control, elem, i);
    }

    Object.freeze(this);
  }
}

class WrappedArrayFactory extends propContainerUtil.PropertyContainerFactory {
  constructor(opt) {
    super();

    this.opt = (opt != null) ? opt : {};
  }

  createInstance(value, keyPath, control, parent) {
    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

    if (value != null && value.hasOwnProperty('$override')) {
      // support overriding of object with new types from mappers
      return value;
    }

    return new WrappedArray(value, this.opt, keyPath, control, parent);
  }

  snapshot(mapper, instance, keyPath) {
    var res = [];
    for (var i = 0, length = instance.length; i < length; i++) {
      res[i] = snapshotUtil.overridableSnapshot(this.opt.elem, mapper, instance[i], keyPath.concat(i));
    }

    return res;
  }
}

module.exports = function (opt) {
  return new WrappedArrayFactory(opt);
};

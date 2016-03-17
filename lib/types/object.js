'use strict';

var forOwn = require('lodash.forown');

var propContainerUtil = require('./propContainerUtil');
var snapshotUtil = require('./snapshotUtil');

var Control = require('../control');

var WrappedObject = require('./wrappedObject');

class WrappedObjectFactory extends propContainerUtil.PropertyContainerFactory {
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

    if (value != null && typeof value !== 'object') {
      // support overriding of object with new types from mappers
      return value;
    }

    return new WrappedObject(value, this.opt, keyPath, control, parent, this);
  }

  snapshot(mapper, instance, keyPath) {
    var res = {};
    forOwn(instance, (value, key) => {
      res[key] = snapshotUtil.overridableSnapshot(this.opt.props[key], mapper, value, keyPath.concat(key));
    });

    return res;
  }

  getProps() {
    return this.opt.props;
  }
}

module.exports = function(opt) {
  return new WrappedObjectFactory(opt);
};

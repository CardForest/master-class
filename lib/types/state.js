'use strict';

var propContainerUtil = require('./propContainerUtil');
var WrappedState = require('./wrappedState');
var Control = require('../control');
var snapshotUtil = require('./snapshotUtil');
var forOwn = require('lodash.forown');
var objectAssign = require('object-assign');

function assignStateOptIdx(stateOpts, currentIdx) {
  stateOpts.forEach((stateOpt) => {
    stateOpt.idx = currentIdx;
    currentIdx++;

    if (stateOpt.hasOwnProperty('subState')) {
      assignStateOptIdx(stateOpt.subState, currentIdx);
    }
  });
}

class WrappedMerge extends propContainerUtil.PropertyContainerFactory {
  constructor(stateOpts) {
    super();

    if (!Array.isArray(stateOpts)) {
      throw TypeError('expected objects array');
    }

    assignStateOptIdx(stateOpts, 0);
    this.stateOpts = stateOpts;
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

    return new WrappedState(value, this.stateOpts, keyPath, control, parent);
  }

  snapshot(mapper, instance, keyPath) {
    var res = {};
    forOwn(instance.delegates, (delegate, idx) => {
      objectAssign(res, snapshotUtil.overridableSnapshot(this.stateOpts[idx].delegate, mapper, delegate, keyPath));
    });

    return res;
  }
}

module.exports = function (objFactoryOpts) {
  return new WrappedMerge(objFactoryOpts);
};

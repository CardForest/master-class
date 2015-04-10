'use strict';

function overridableSnapshot(factory, mapper, instance, keyPath) {
  return mapper(factory.opt, instance, keyPath, factory.snapshot.bind(factory, mapper, instance, keyPath));
}

function noOpMapper(opt, instance, keyPath, snapshotFn) {
  return snapshotFn();
}

module.exports = {
  overridableSnapshot: overridableSnapshot,
  noOpMapper: noOpMapper
}

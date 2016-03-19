'use strict';

module.exports = function overridableSnapshot(factory, mapper, instance, keyPath) {
  return mapper(factory.opt, instance, keyPath, factory.snapshot.bind(factory, mapper, instance, keyPath));
};

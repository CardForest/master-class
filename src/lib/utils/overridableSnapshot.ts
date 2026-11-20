import type { Factory, KeyPath, SnapshotMapper } from '../../types';

function overridableSnapshot(
  factory: Factory, mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath
): unknown {
  if (!factory.snapshot) {
    throw new TypeError('factory does not support snapshots');
  }
  return mapper(factory.opt, instance, keyPath, factory.snapshot.bind(factory, mapper, instance, keyPath));
}

export = overridableSnapshot;

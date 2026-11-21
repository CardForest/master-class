import overridableSnapshot = require('../utils/overridableSnapshot');
import MObject = require('./mObject');
import traverseStates = require('../utils/traverseStates');
import { RestoredModel, trackModel } from '../utils/modelData';
import {
  rootOf, isRecord,
  type KeyPath, type ControlOptions, type Managed, type SnapshotMapper, type CompiledState
} from '../../types';
import type Control = require('../utils/control');

class MState {
  static readonly modelKind = 'state';
  static createInstance = MObject.createInstance;
  static toPropertyDescriptor = MObject.toPropertyDescriptor;
  static handleRootObject = MObject.handleRootObject;
  static deserialize = MObject.deserialize;
  declare readonly keyPath: KeyPath;
  declare readonly control: Control;
  declare readonly root: object;
  declare readonly parent?: object;
  declare readonly export: Managed['export'];
  declare readonly serialize: Managed['serialize'];
  declare readonly snapshot: Managed['snapshot'];
  declare readonly delegates: Record<number, Record<string, unknown>>;
  [key: string]: unknown;

  static get opt(): readonly CompiledState[] {
    throw new Error('MState requires factory options');
  }

  constructor(value?: unknown, _keyPath?: KeyPath | Control | ControlOptions, _control?: Control, parent?: object) {
    const Class = this.constructor as typeof MState;
    const { isRoot, keyPath, control } = Class.handleRootObject(this, value, _keyPath, _control, parent);
    const opt = Class.opt;
    const restored = RestoredModel.forKind(value, 'state');
    const initialValue = restored ? restored.seed : value;
    Object.defineProperty(this, control.rootPropertyName, {
      enumerable: false, configurable: false, value: rootOf(parent, this, control), writable: false
    });
    Object.defineProperty(this, 'keyPath', {
      enumerable: false, configurable: false, value: keyPath, writable: false
    });
    const delegates: Record<number, Record<string, unknown>> = {};
    Object.defineProperty(this, 'delegates', {
      enumerable: false, configurable: false, value: delegates, writable: false
    });
    control.addCleanup(this, () => Object.values(delegates).forEach((delegate) => control.dispose(delegate)));
    trackModel(this, 'state', (write) => Object.fromEntries(
      Object.entries(delegates).map(([idx, delegate]) => [idx, write(delegate)])
    ), undefined, initialValue);

    let oldProps: string[] = [];
    const updateDelegates = (saved?: RestoredModel) => {
      const props2DelegateIdx: Record<string, number> = Object.create(null) as Record<string, number>;
      const traverse = (stateOpts: readonly CompiledState[], parentPredicate: boolean): void => {
        stateOpts.forEach((stateOpt) => {
          const { idx } = stateOpt;
          const predicate = saved ? parentPredicate && Object.hasOwn(saved.fields, idx)
            : parentPredicate && (!stateOpt.when || !!stateOpt.when.call(this));
          if (predicate) {
            if (!Object.hasOwn(delegates, idx)) {
              const input = saved ? RestoredModel.forKind(saved.fields[idx], 'object') : initialValue;
              if (saved && !input) throw new TypeError('invalid serialized state delegate');
              delegates[idx] = stateOpt.delegate.createInstance(input, keyPath, control, parent ?? this) as Record<string, unknown>;
            }
            Object.keys(stateOpt.delegate.props).forEach((key) => {
              props2DelegateIdx[key] = idx;
            });
          } else if (Object.hasOwn(delegates, idx)) {
            control.dispose(delegates[idx]);
            delete delegates[idx];
          }
          if (stateOpt.subState.length !== 0) {
            traverse(stateOpt.subState!, predicate);
          }
        });
      };
      traverse(opt, true);
      Object.entries(props2DelegateIdx).forEach(([key, delegateIdx]) => {
        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          get() {
            return delegates[delegateIdx]![key];
          },
          set(val: unknown) {
            delegates[delegateIdx]![key] = val;
          }
        });
      });
      oldProps.forEach((key) => {
        if (!Object.hasOwn(props2DelegateIdx, key)) {
          delete this[key];
        }
      });
      oldProps = Object.keys(props2DelegateIdx);
    };
    try {
      if (restored) {
        updateDelegates(restored);
        if (Object.keys(restored.fields).length !== Object.keys(delegates).length) {
          throw new TypeError('serialized delegates do not match the model schema');
        }
        const savedDelegates = Object.entries(delegates);
        restored.register(this, () => {
          if (Object.keys(delegates).length !== savedDelegates.length ||
              savedDelegates.some(([key, delegate]) => delegates[Number(key)] !== delegate)) {
            throw new TypeError('state predicates changed the serialized active delegates');
          }
        });
      }
      traverseStates(opt, (state) => {
        const unsubscribe = control.addWatcher({
          watchFn: state.when ? state.when.bind(this) : () => true,
          listenerFn: () => updateDelegates(),
          lastValue: restored ? Object.hasOwn(delegates, state.idx) : undefined
        });
        control.addCleanup(this, unsubscribe);
      });
      if (isRoot) control.emit('change');
    } catch (error) {
      control.dispose(this);
      throw error;
    }
  }

  static snapshot(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown {
    if (!isRecord(instance)) return instance;
    if (!isRecord(instance.delegates)) {
      throw new TypeError('expected state');
    }
    const delegates = instance.delegates;
    const owners = new Map<string, number>();
    const active: CompiledState[] = [];
    traverseStates(this.opt, (state) => {
      const { idx, delegate } = state;
      if (Object.hasOwn(delegates, idx)) {
        active.push(state);
        for (const key of Object.keys(delegate.props)) owners.set(key, idx);
      }
    });
    const entries: [string, unknown][] = [];
    for (const { idx, delegate } of active) {
      const live = delegates[idx];
      if (!isRecord(live)) throw new TypeError('expected state delegate');
      const projected = mapper(delegate.opt, live, keyPath, () => Object.fromEntries(
        Object.keys(live).filter((key) => owners.get(key) === idx).map((key) =>
          [key, overridableSnapshot(delegate.props[key]!, mapper, live[key], keyPath.concat(key))])
      ));
      // Delegates are flattened, so a scalar replacement has no slot of its own.
      if (isRecord(projected) && !Array.isArray(projected)) {
        for (const entry of Object.entries(projected)) {
          if (!owners.has(entry[0]) || owners.get(entry[0]) === idx) entries.push(entry);
        }
      }
    }
    return Object.fromEntries(entries);
  }
}

export = MState;

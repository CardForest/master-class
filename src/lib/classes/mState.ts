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
    const initialValue = restored ? undefined : value;
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
    ));

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
    const res: Record<string, unknown> = {};
    const delegates = instance.delegates;
    traverseStates(this.opt, ({ idx, delegate }) => {
      if (Object.hasOwn(delegates, idx)) {
        Object.assign(res, overridableSnapshot(delegate, mapper, delegates[idx], keyPath));
      }
    });
    return res;
  }
}

export = MState;

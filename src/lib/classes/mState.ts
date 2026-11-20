import overridableSnapshot = require('../utils/overridableSnapshot');
import MObject = require('./mObject');
import traverseStates = require('../utils/traverseStates');
import {
  rootOf, isRecord,
  type KeyPath, type ControlOptions, type SnapshotMapper, type StateOptions
} from '../../types';
import type Control = require('../utils/control');

class MState {
  static createInstance = MObject.createInstance;
  static toPropertyDescriptor = MObject.toPropertyDescriptor;
  static handleRootObject = MObject.handleRootObject;
  declare readonly keyPath: KeyPath;
  declare readonly control: Control;
  declare readonly root: object;
  declare readonly parent?: object;
  declare snapshot: (mapper?: SnapshotMapper) => unknown;
  declare readonly delegates: Record<number, Record<string, unknown>>;
  [key: string]: unknown;

  static get opt(): StateOptions[] {
    throw new Error('MState requires factory options');
  }

  constructor(value?: unknown, _keyPath?: KeyPath | Control | ControlOptions, _control?: Control, parent?: object) {
    const Class = this.constructor as typeof MState;
    const { isRoot, keyPath, control } = Class.handleRootObject(this, value, _keyPath, _control, parent);
    const opt = Class.opt;
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

    let oldProps: string[] = [];
    const updateDelegates = () => {
      const props2DelegateIdx: Record<string, number> = {};
      const traverse = (stateOpts: StateOptions[], parentPredicate: boolean): void => {
        stateOpts.forEach((stateOpt) => {
          const idx = stateOpt.idx!;
          const predicate = parentPredicate && (!stateOpt.when || !!stateOpt.when.call(this));
          if (predicate) {
            if (!Object.hasOwn(delegates, idx)) {
              delegates[idx] = stateOpt.delegate.createInstance(value, keyPath, control, parent) as Record<string, unknown>;
            }
            Object.keys(stateOpt.delegate.props).forEach((key) => {
              props2DelegateIdx[key] = idx;
            });
          } else if (Object.hasOwn(delegates, idx)) {
            delete delegates[idx];
          }
          if (Object.hasOwn(stateOpt, 'subState')) {
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
    traverseStates(opt, (state) => {
      control.addWatcher({
        watchFn: state.when ? state.when.bind(this) : () => true,
        listenerFn: updateDelegates
      });
    });
    if (isRoot) {
      control.emit('change');
    }
  }

  static snapshot(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown {
    if (!isRecord(instance) || !isRecord(instance.delegates)) {
      throw new TypeError('expected state');
    }
    const res: Record<string, unknown> = {};
    Object.entries(instance.delegates).forEach(([idx, delegate]) => {
      Object.assign(res, overridableSnapshot(this.opt[Number(idx)]!.delegate, mapper, delegate, keyPath));
    });
    return res;
  }
}

export = MState;

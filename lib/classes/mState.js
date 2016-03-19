'use strict';

const Control = require('../control');
const overridableSnapshot = require('../utils/overridableSnapshot');
const forOwn = require('lodash.forown');
const MObject = require('./mObject');

class MState {
  constructor(value, keyPath, control, parent) {
    const opt = this.constructor.opt;

    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

    const root = parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent;

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

    Object.defineProperty(
      this,
      'keyPath',
      {
        enumerable: false,
        configurable: false,
        value: keyPath,
        writable: false
      }
    );

    const delegates = {};
    Object.defineProperty(
      this,
      'delegates',
      {
        enumerable: false,
        configurable: false,
        value: delegates,
        writable: false
      }
    );

    let oldProps = [];
    const updateDelegates = () => {
      const props2DelegateIdx = {};
      const traverse = (stateOpts, parentPredicate) => {
        stateOpts.forEach((stateOpt) => { // do traverse only once later just follow the array
          let predicate = (parentPredicate && (!stateOpt.when || stateOpt.when.call(this)));
          if (predicate) {
            if (!delegates.hasOwnProperty(stateOpt.idx)) {
              delegates[stateOpt.idx] = stateOpt.delegate.createInstance(value, keyPath, control, parent);
            }
            Object.keys(stateOpt.delegate.props).forEach((key) => {
              props2DelegateIdx[key] = stateOpt.idx;
            });
          } else if (delegates.hasOwnProperty(stateOpt.idx)) {
            delete delegates[stateOpt.idx];
          }

          if (stateOpt.hasOwnProperty('subState')) {
            traverse(stateOpt.subState, predicate);
          }
        });
      };

      traverse(opt, true);

      forOwn(props2DelegateIdx, (delegateIdx, key) => {
        Object.defineProperty(
          this, key,
          {
            configurable: true,
            enumerable: true,
            get() {
              return delegates[delegateIdx][key];
            },
            set(val) {
              delegates[delegateIdx][key] = val;
            }
          }
        );
      });

      oldProps.forEach((key) => {
        if (!props2DelegateIdx.hasOwnProperty(key)) {
          delete this[key];
        }
      });
      oldProps = Object.keys(props2DelegateIdx);
    };

    control.on('instance created', updateDelegates);
    control.on('change', updateDelegates);
  }

  static snapshot(mapper, instance, keyPath) {
    var res = {};
    forOwn(instance.delegates, (delegate, idx) => {
      Object.assign(res, overridableSnapshot(this.opt[idx].delegate, mapper, delegate, keyPath));
    });

    return res;
  }
}

MState.createInstance = MObject.createInstance;
MState.toPropertyDescriptor = MObject.toPropertyDescriptor;

module.exports = MState;

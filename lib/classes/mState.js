'use strict';

const overridableSnapshot = require('../utils/overridableSnapshot');
const forOwn = require('lodash.forown');
const MObject = require('./mObject');
const traverseStates = require('../utils/traverseStates');

class MState {
  constructor(value, _keyPath, _control, parent) {
    const handleRootObjectResponse = this.constructor.handleRootObject(this, value, _keyPath, _control, parent);
    // TODO replace this destructuring when available
    const isRoot = handleRootObjectResponse.isRoot,
      keyPath = handleRootObjectResponse.keyPath,
      control = handleRootObjectResponse.control;

    const opt = this.constructor.opt;

    const root = isRoot ? this : (parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent);

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

    traverseStates(opt, (state) => {
      control.addWatcher({
        watchFn: (state.when) ? state.when.bind(this) : () => true,
        listenerFn: updateDelegates
      });
    });

    if (isRoot) {
      control.emit('change');
    }
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
MState.handleRootObject = MObject.handleRootObject;

module.exports = MState;

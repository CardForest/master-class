class SubStatesContainer {
  $$olderFirst() {
    return Object.entries(this)
      .filter(([key, val]) => key[0] !== '#' && key !== '$keyPath')
      .map(([, val]) => val);
  }

  $$newerFirst() {
    return this.$$olderFirst().reverse();
  }

  $$newest() {
    return this.$$olderFirst().slice(-1)[0];
  }
}

class State {
  constructor(raw) {
    if (raw) {
      Object.assign(this, raw);
    } else {
    // Reflect.defineProperty(this, '$subStates', {value: new SubStatesContainer(), enumerable: true});
      this.$subStates = new SubStatesContainer();
    }
  }

  $$forEachTopDown(cb) {
    cb(this);
    for (let child of this.$subStates.$$olderFirst()) {
      try {
        child.$$forEachTopDown(cb);
      } catch( e) {debugger}
    }
  }

  $$findBottomUp(predicate) {
    for (let child of this.$subStates.$$newerFirst()) {
      // try {
      const childResult = child.$$findBottomUp(predicate);
      if (childResult != null) {
        return childResult;
      }
    // } catch( e) {
    //     console.log(this.$subStates)
    //     debugger
    //   }
    }

    if (predicate(this)) {
      return this;
    }
  }

  $$getBottom() {
    const newestChild = this.$subStates.$$newest();
    return (newestChild == null) ? this : newestChild.$$getBottom();
  }
}

const util = require('util');

const EXCLUDED_ROOT_PROP_KEYS = new Set(['constructor',
                                          util.inspect.custom, 'inspect', // TODO add those only on nodejs
                                          '$$cloneIdx', '$subStates', '$$raw', 'hasOwnProperty'
                                        ]);
const EXCLUDED_STATE_PROP_KEYS = new Set(['$subStates',
                                          util.inspect.custom, 'inspect', // TODO add those only on nodejs
                                         ]);

class RootState extends State {
  constructor(raw) {//root) {
    super(raw);

    // this.$$root = root ? root : new State();
    Reflect.defineProperty(this, '$$raw', {value: this});
    // this.$subStates = new SubStatesContainer();

    return new Proxy(this, {
      get(target, propKey, receiver) {
        console.log(propKey)
        console.log(propKey == Symbol.for('util.inspect.custom'))
        console.log(propKey == Symbol('util.inspect.custom'))
        console.log(propKey === util.inspect.custom)
        return Reflect.get(target.$$getLowestMatchingOrTopState(propKey), propKey, receiver);
      },
      getOwnPropertyDescriptor(target, propKey) {
        return Reflect.getOwnPropertyDescriptor(target.$$getLowestMatchingOrTopState(propKey), propKey);
      },
      has(target, propKey) {
        return Reflect.has(target.$$getLowestMatchingOrTopState(propKey), propKey);
      },
      deleteProperty(target, propKey) {
        return Reflect.deleteProperty(target.$$getLowestMatchingOrTopState(propKey), propKey);
      },
      ownKeys(target) {
        const treeOwnKeys = new Set();
        target.$$forEachTopDown((_) => {
          Reflect
            .ownKeys(_)
            .filter((_) => !EXCLUDED_STATE_PROP_KEYS.has(_))
            .forEach((_) => {
              treeOwnKeys.add(_);
            });
        });

        return ['$subStates', ...treeOwnKeys];
      },
      defineProperty(target, propKey, descriptor) {
        return Reflect.defineProperty(target.$$getLowestMatchingOrBottomState(propKey), propKey, descriptor);
      },
      set(target, propKey, value, receiver) {
        return Reflect.set(target.$$getLowestMatchingOrBottomState(propKey), propKey, value, receiver);
      }
    });
  }

  $$getLowestMatchingOrTopState(propKey) {
    if (!EXCLUDED_ROOT_PROP_KEYS.has(propKey)) {
      const targetState = this.$$findBottomUp((_) => Reflect.has(_, propKey));
      if (targetState) {
        return targetState;
      }
    }
    return this;
  }

  $$getLowestMatchingOrBottomState(propKey) {
    if (!EXCLUDED_ROOT_PROP_KEYS.has(propKey)) {
      const targetState = this.$$findBottomUp((_) => Reflect.has(_, propKey));
      if (targetState) {
        return targetState;
      } else {
        // if no state has this propKey we want the most-specific state (leftmost)
        return Reflect.has(this, propKey) ? this : this.$$getBottom();
      }
    }
    return this;
  }

  clone() {
    return Object.assign({$$classId: this.constructor.name}, this.$$raw);
  }

  static construct(clone) {
    return new this(clone);
  }
}

module.exports = {RootState, State, SubStatesContainer};

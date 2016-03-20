'use strict';

const EventEmitter = require('events');

class Control extends EventEmitter {
  constructor() {
    super();

    this.isChangeAllowed = true;
    this.rootPropertyName = 'root';
    this.watchers = [];

    this.on('change', this.digest.bind(this));
  }

  onMutatorCall(keyPath, args, mutator) {
    return mutator.apply(this, args);
  }

  addWatcher(watcher) {
    this.watchers.push(watcher);
  }

  digest() {
    let dirty;
    const processWatcher = (watcher) => {
      const newValue = watcher.watchFn();
      const oldValue = watcher.lastValue;
      if (!!oldValue !== !!newValue) { // jshint ignore:line
        watcher.listenerFn();
        dirty = true;
        watcher.lastValue = newValue;
      }
    };
    do {
      dirty = false;
      this.watchers.forEach(processWatcher);
    } while (dirty);
  }
}


module.exports = Control;

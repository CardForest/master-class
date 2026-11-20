import { EventEmitter } from 'node:events';
import type { ControlOptions, KeyPath } from '../../types';

interface Watcher {
  watchFn: () => unknown;
  listenerFn: () => void;
  lastValue?: unknown;
}

class Control extends EventEmitter {
  isChangeAllowed = true;
  rootPropertyName = 'root';
  watchers: Watcher[] = [];

  constructor(opt?: ControlOptions) {
    super();
    this.on('change', this.digest.bind(this));
    Object.assign(this, opt);
  }

  onMutatorCall<T, A extends unknown[], R>(
    this: T, _keyPath: KeyPath, args: A, mutator: (this: T, ...args: A) => R
  ): R {
    return mutator.apply(this, args);
  }

  addWatcher(watcher: Watcher): void {
    this.watchers.push(watcher);
  }

  digest(): void {
    let dirty: boolean;
    const processWatcher = (watcher: Watcher) => {
      const newValue = watcher.watchFn();
      const oldValue = watcher.lastValue;
      if (!!oldValue !== !!newValue) {
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

export = Control;

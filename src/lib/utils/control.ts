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
  private readonly cleanups = new WeakMap<object, (() => void)[]>();

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

  addWatcher(watcher: Watcher): () => void {
    this.watchers.push(watcher);
    return () => {
      const index = this.watchers.indexOf(watcher);
      if (index !== -1) this.watchers.splice(index, 1);
    };
  }

  addCleanup(owner: object, cleanup: () => void): void {
    const cleanups = this.cleanups.get(owner);
    if (cleanups) cleanups.push(cleanup);
    else this.cleanups.set(owner, [cleanup]);
  }

  dispose(owner: unknown): void {
    if (owner === null || typeof owner !== 'object') return;
    const cleanups = this.cleanups.get(owner);
    this.cleanups.delete(owner);
    cleanups?.forEach((cleanup) => cleanup());
  }

  digest(): void {
    let dirty: boolean;
    const processWatcher = (watcher: Watcher) => {
      if (!this.watchers.includes(watcher)) return;
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
      this.watchers.slice().forEach(processWatcher);
    } while (dirty);
  }
}

export = Control;

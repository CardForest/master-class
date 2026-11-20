import type { StateOptions } from '../../types';

function traverseStates(states: StateOptions[], cb: (state: StateOptions) => void): void {
  const pending = states.slice();
  while (pending.length !== 0) {
    const state = pending.shift()!;
    cb(state);
    if (Object.hasOwn(state, 'subState')) {
      pending.unshift(...state.subState!);
    }
  }
}

export = traverseStates;

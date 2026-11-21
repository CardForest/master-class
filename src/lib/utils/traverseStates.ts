function traverseStates<T extends { subState?: readonly T[] }>(states: readonly T[], cb: (state: T) => void): void {
  const pending = states.slice();
  while (pending.length !== 0) {
    const state = pending.shift()!;
    cb(state);
    if (state.subState) {
      pending.unshift(...state.subState);
    }
  }
}

export = traverseStates;

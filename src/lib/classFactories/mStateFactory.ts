import MState = require('../classes/mState');
import type { CompiledState, ManagedClass, StateOptions } from '../../types';

interface StateClass extends ManagedClass<Record<string, unknown>> {
  readonly opt: readonly StateOptions[];
}

function mStateFactory(opt: readonly StateOptions[]): StateClass {
  if (!Array.isArray(opt)) {
    throw new TypeError('expected objects array');
  }
  let currentIdx = 0;
  const compile = (states: readonly StateOptions[]): CompiledState[] => states.map((state) => {
    const idx = currentIdx++;
    return {
      ...state,
      idx,
      subState: compile(state.subState ?? [])
    };
  });
  const states = compile(opt);
  return class extends MState {
    static get opt() { return states; }
  } as StateClass;
}

export = mStateFactory;

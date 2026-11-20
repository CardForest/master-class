import MState = require('../classes/mState');
import traverseStates = require('../utils/traverseStates');
import type { Factory, Managed, StateOptions } from '../../types';

interface StateClass extends Factory<Record<string, unknown> & Managed> {
  new(...args: ConstructorParameters<typeof MState>): Record<string, unknown> & Managed;
  readonly opt: StateOptions[];
}

function mStateFactory(opt: StateOptions[]): StateClass {
  if (!Array.isArray(opt)) {
    throw new TypeError('expected objects array');
  }
  let currentIdx = 0;
  traverseStates(opt, (state) => { state.idx = currentIdx++; });
  return class extends MState {
    static get opt() { return opt; }
  } as StateClass;
}

export = mStateFactory;

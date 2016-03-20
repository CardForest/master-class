'use strict';

module.exports = function traverseStates(states, cb) {
  states = states.slice();

  while (states.length !== 0) {
    const state = states.shift();
    cb(state);
    if (state.hasOwnProperty('subState')) {
      states.unshift.apply(states, state.subState);
    }
  }
};

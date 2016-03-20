'use strict';

const MState = require('../classes/mState');
const traverseStates = require('../utils/traverseStates');

module.exports = function mStateFactory(opt) {
  if (!Array.isArray(opt)) {
    throw TypeError('expected objects array');
  }

  let currentIdx = 0;
  traverseStates(opt, (state) => {
    state.idx = currentIdx++;
  });

  return class extends MState {
    static get opt() {return opt;}
  };
};

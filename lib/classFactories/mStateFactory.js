'use strict';

const MState = require('../classes/mState');

function assignStateOptIdx(stateOpts, currentIdx) {
  stateOpts.forEach((stateOpt) => {
    stateOpt.idx = currentIdx;
    currentIdx++;

    if (stateOpt.hasOwnProperty('subState')) {
      assignStateOptIdx(stateOpt.subState, currentIdx);
    }
  });
}

module.exports = function mStateFactory(opt) {
  if (!Array.isArray(opt)) {
    throw TypeError('expected objects array');
  }

  assignStateOptIdx(opt, 0);

  return class extends MState {
    static get opt() {return opt;}
  };
};

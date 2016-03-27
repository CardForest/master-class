'use strict';

const MArray = require('../classes/mArray');

module.exports = function mArrayFactory(opt) {
  const MyMArray = class extends MArray {
    constructor(value) {
      super(value);
    }
  };

  Object.defineProperty(MyMArray, 'opt', {value: opt});

  const length = opt.defaultLength;
  for (var i = 0; i < length; i++) {
    Object.defineProperty(
      MyMArray.prototype,
      i,
      opt.elem.toPropertyDescriptor(i)
    );
  }

  return MyMArray;
};

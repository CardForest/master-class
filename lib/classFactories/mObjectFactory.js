'use strict';

const MObject = require('../classes/mObject');

module.exports = function mObjectFactory(opt) {
  if (!opt.hasOwnProperty('props')) {
    throw Error('object options must include \'props\'');
  }

  return class extends MObject {
    constructor(value, keyPath, control, parent) {
      super(value, keyPath, control, parent);
    }

    static get opt() {return opt;}
  };
};

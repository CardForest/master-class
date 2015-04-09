'use strict';

module.exports = {
  default: {
    isChangeAllowed: true,
    set: function (cb) {
      if (! this.isChangeAllowed) {
        throw Error('change is not allowed in this context');
      }
      cb();
      // TODO:
      // this.logChange('setValue', keyPath, key, newValue);
    }
  }
};

'use strict';

module.exports = {
  default: {
    isChangeAllowed: true,
    set: function (cb, newValue, keyPath, key) {
      if (! this.isChangeAllowed) {
        throw Error('change is not allowed in this context');
      }
      cb();
      this.onChange('setValue', {newValue: newValue, trgKeyPath: keyPath, key: key});
    },
    onChange: function() {}
  }
};

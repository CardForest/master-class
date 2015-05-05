'use strict';

module.exports = {
  default: {
    isChangeAllowed: true,
    set: function (cb, newValue, keyPath, key, factoryOptions) {
      if (! this.isChangeAllowed) {
        throw Error('change is not allowed in this context');
      }
      cb();
      this.onChange('setValue', {newValue: newValue, trgKeyPath: keyPath, key: key}, factoryOptions);
    },
    onChange: function() {},
    rootPropertyName: 'root'
  }
};

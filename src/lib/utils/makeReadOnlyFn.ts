import type Control = require('./control');

function makeReadOnlyFn<T, R>(fn: (this: T) => R, control: Control): (this: T) => R {
  return function () {
    if (control.isChangeAllowed) {
      control.isChangeAllowed = false;
      try {
        return fn.call(this);
      } finally {
        control.isChangeAllowed = true;
      }
    }
    return fn.call(this);
  };
}

export = makeReadOnlyFn;

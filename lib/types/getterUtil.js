module.exports = {
  makeReadOnlyFn(fn, control) {
    return function () {
      if (control.isChangeAllowed) {
        control.isChangeAllowed = false;
        try {
          return fn.call(this);
        } finally {
          control.isChangeAllowed = true;
        }
      } else {
        return fn.call(this);
      }
    };
  }
};

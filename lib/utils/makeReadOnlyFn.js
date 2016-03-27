module.exports = function makeReadOnlyFn(fn) {
  return function () {
    if (this.$context.isChangeAllowed) {
      this.$context.isChangeAllowed = false;
      try {
        return fn.call(this);
      } finally {
        this.$context.isChangeAllowed = true;
      }
    } else {
      return fn.call(this);
    }
  };
};

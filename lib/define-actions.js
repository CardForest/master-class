module.exports = function defineActions({prototype}, actions) {
  Object.entries(actions).forEach(([actionId, action]) => {
    prototype[actionId] = function(...args) {
      return this.$context.isProxy ?
                this.$context.dispatcher.dispatch('action', {keyPath: this.$keyPath, actionId, args})
              : action.apply(this, args);
    };
  });
};

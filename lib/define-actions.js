module.exports = function defineActions({prototype}, actions) {
  Object.entries(actions).forEach(([actionType, action]) => {
    prototype[actionType] = function(...args) {
      return this.$context.isProxy ?
                this.$context.dispatcher.dispatch('action', {
                  targetKeyPath: this.$keyPath,
                  actionType,
                  args
                })
              : action.apply(this, args);
    };
  });
};

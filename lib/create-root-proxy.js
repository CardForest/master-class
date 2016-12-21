const EXCLUDED_PROP_KEYS = ['length', '$parent', '$keyPath', '$revocable', '$context', '$revoke'];

function revokeProxy(proxy) {
  delete proxy.$parent;
  delete proxy.$keyPath;
  delete proxy.$context;
  const revocable = proxy.$revocable;
  delete proxy.$revocable;
  revocable.revoke();
}

function createDescendantProxy(object, parent, propertyKey) {
  object.$parent = parent;
  object.$keyPath = parent.$keyPath.concat(propertyKey);
  object.$context = parent.$context;
  createProxy(object);
}

function createProxy(object) {
  const revocable = Proxy.revocable(object, {
      set(target, propertyKey, value, receiver) {
        if (!EXCLUDED_PROP_KEYS.includes(propertyKey)) {
          target.$context.dispatch('action', {
            targetKeyPath: target.$keyPath,
            actionType: 'set',
            payload: {value, propertyKey}
          });

          if (target.hasOwnProperty(propertyKey)) {
            const oldValue = target[propertyKey];
            if (oldValue instanceof Object
              && oldValue !== value
              && oldValue.hasOwnProperty('$parent')
              && oldValue.$parent === target) {
              // we are deleting an object from it's first reference -> revoke it
              revokeProxy(oldValue);
            }
          }

          if (value instanceof Object) {
            if (!value.hasOwnProperty('$revocable')) {
              // this is a new object -> wrap it in a proxy
              createDescendantProxy(value, target, propertyKey);
            }
            value = value.$revocable.proxy;
          }
        }
        return Reflect.set(target, propertyKey, value, receiver);
      },
      deleteProperty(target, propertyKey) {
        if (!EXCLUDED_PROP_KEYS.includes(propertyKey)) {
          target.$context.dispatch('action', {
            targetKeyPath: target.$keyPath,
            actionType: 'deleteProperty',
            payload: {propertyKey}
          });

          if (target.hasOwnProperty(propertyKey)) {
            const value = target[propertyKey];
            if (value instanceof Object
              && value.hasOwnProperty('$parent')
              && value.$parent === target) {
              // we are deleting an object from it's first reference -> revoke it
              revokeProxy(value);
            }
          }
        }

        return Reflect.deleteProperty(target, propertyKey)
      }
    }
  );

  Reflect.defineProperty(object, '$revocable', {value: revocable});

  return revocable.proxy;
}

module.exports = function createRootProxy(object, context = {dispatch() {}}) {
  Reflect.defineProperty(object, '$revoke', {value: function () {
    delete this.$keyPath;
    delete this.$context;
    delete this.$revoke;
    const revocable = proxy.$revocable;
    delete proxy.$revocable;
    revocable.revoke();
  }});

  return createProxy(Object.assign(object, {
    $keyPath: [], $context: context
  }));
};

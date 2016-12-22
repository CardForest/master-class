const EXCLUDED_PROP_KEYS = ['length', '$parent', '$keyPath', '$skeleton', '$context', '$revoke'];

function revokeDescendantProxy(proxy) {
  delete proxy.$parent;
  delete proxy.$keyPath;
  delete proxy.$context;
  const revocable = proxy.$skeleton;
  delete proxy.$skeleton;
  revocable.revoke();
}

function attachDescendantProxy(object, parent, propertyKey) {
  object.$parent = parent;
  object.$keyPath = parent.$keyPath.concat(propertyKey);
  object.$context = parent.$context;
  attachProxy(object);
}

function attachProxy(object) {
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
            if (oldValue instanceof Object &&
                oldValue !== value &&
                oldValue.hasOwnProperty('$parent') &&
                oldValue.$parent === target) {
              // we are deleting an object from it's first reference -> revoke it
              revokeDescendantProxy(oldValue);
            }
          }

          if (value instanceof Object) {
            if (!value.hasOwnProperty('$skeleton')) {
              // this is a new object -> wrap it in a proxy
              attachDescendantProxy(value, target, propertyKey);
            }
            value = value.$skeleton.proxy;
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
            if (value instanceof Object &&
                value.hasOwnProperty('$parent') &&
                value.$parent === target) {
              // we are deleting an object from it's first reference -> revoke it
              revokeDescendantProxy(value);
            }
          }
        }

        return Reflect.deleteProperty(target, propertyKey);
      }
    }
  );

  Reflect.defineProperty(object, '$skeleton', {value: revocable});

  return revocable;
}

function revokeBaseProxy() {
  delete this.$keyPath;
  delete this.$context;
  delete this.$revoke;
  const revocable = this.$skeleton;
  delete this.$skeleton;
  revocable.revoke();
}
module.exports = function skeleton(object, context = {dispatch() {}}) {
  Reflect.defineProperty(object, '$revoke', {value: revokeBaseProxy});

  return attachProxy(Object.assign(object, {
    $keyPath: [], $context: context
  })).proxy;
};

const EXCLUDED_PROP_KEYS = ['length', '$parent', '$keyPath', '$skeleton', '$context', '$revoke'];

function revokeDescendantProxy() {
  delete this.$parent;
  delete this.$keyPath;
  delete this.$context;
  const revocable = this.$skeleton;
  delete this.$skeleton;
  revocable.revoke();
}

function attachDescendantProxy(object, parent, propertyKey) {
  object.$parent = parent;
  object.$keyPath = parent.$keyPath.concat(propertyKey);
  object.$context = parent.$context;
  attachProxy(object);
  Reflect.defineProperty(object, '$revoke', {value: revokeDescendantProxy});
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
                oldValue !== value && (!value.hasOwnProperty('$skeleton') || oldValue !== value.$skeleton.proxy) &&
                oldValue.hasOwnProperty('$parent') &&
                oldValue.$parent === receiver &&
                oldValue.$keyPath[oldValue.$keyPath.length - 1] === propertyKey) {
              // we are deleting an object from it's first reference -> revoke it
              oldValue.$revoke();
            }
          }

          if (value instanceof Object) {
            if (!value.hasOwnProperty('$skeleton')) {
              // this is a new object -> wrap it in a proxy
              attachDescendantProxy(value, receiver, propertyKey);
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
                value.$parent === target.$skeleton.proxy &&
                value.$keyPath[value.$keyPath.length - 1] === propertyKey) {
              // we are deleting an object from it's first reference -> revoke it
              value.$revoke();
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
module.exports = function skeleton(object = {}, context = {dispatch() {}}) {
  Reflect.defineProperty(object, '$revoke', {value: revokeBaseProxy});
  object.$keyPath = [];
  Reflect.defineProperty(object, '$context', {value: context});

  return attachProxy(object).proxy;
};

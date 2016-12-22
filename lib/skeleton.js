const EXCLUDED_PROP_KEYS = ['length', '$parent', '$keyPath', '$skeleton', '$context', '$revoke', '$raw'];

function revokeDescendantProxy() {
  delete this.$parent;
  delete this.$keyPath;
  delete this.$context;
  const revocable = this.$skeleton;
  delete this.$skeleton;
  revocable.revoke();
}

function attachDescendantProxy(object, parent, propertyKey) {
  Reflect.defineProperty(object, '$raw', {value: object});
  // todo make $parent enumerable if/when tests pass on chrome and firefox
  Reflect.defineProperty(object, '$parent', {value: parent});
  object.$keyPath = parent.$keyPath.concat(propertyKey);
  Reflect.defineProperty(object, '$context', {value: parent.$context});
  attachProxy(object);
  Reflect.defineProperty(object, '$revoke', {value: revokeDescendantProxy});
}

function _processObjectToProxifyProp(objectsToProxifyProps, objectToProxifyProps, [key, value]) {
  if (!EXCLUDED_PROP_KEYS.includes(key) && value instanceof Object) {
    if (!value.hasOwnProperty('$skeleton')) {
      // this is a new object -> wrap it in a proxy
      attachDescendantProxy(value, objectToProxifyProps, key);
    }
    objectsToProxifyProps.push(objectToProxifyProps.$raw[key] = value.$skeleton.proxy);
  }
}

function _processObjectsToProxifyProps(objectsToProxifyProps) {
  while (objectsToProxifyProps.length !== 0) {
    const objectToProxifyProps = objectsToProxifyProps.shift();
    Object.entries(objectToProxifyProps)
      .forEach(
        _processObjectToProxifyProp.bind(undefined, objectsToProxifyProps, objectToProxifyProps)
      );
  }
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
              _processObjectsToProxifyProps([value.$skeleton.proxy]);
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
  Reflect.defineProperty(object, '$raw', {value: object});
  Reflect.defineProperty(object, '$revoke', {value: revokeBaseProxy});
  object.$keyPath = [];
  Reflect.defineProperty(object, '$context', {value: context});

  const proxy = attachProxy(object).proxy;
  _processObjectsToProxifyProps([proxy]);

  return proxy;
};

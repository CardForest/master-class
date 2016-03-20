# Serialization

Instances initial value can be determined by the class

```js
const MyClass = M({
  n: 3,
  s: 'test',
  b: true
});
let myInstance = new MyClass();

assert.deepEqual(
  myInstance,
  {n: 3, s: 'test', b: true}
);
```

It can also be overridden in the constructor

```js
assert.deepEqual(
  new MyClass({n: 4, s: 'test2', b: false}),
  {n: 4, s: 'test2', b: false}
);
```

We also have a non-enumerable `snapshot` method that converts the instance into a raw plain object, stripping it from any getters or setters

```js
assert.deepEqual(
  MyClass.createInstance(myInstance.snapshot()),
  myInstance
);
```

Additionally, you can provide a `mapper` to override the snapshot process

```js
assert.deepEqual(
  myInstance.snapshot(
    function (opt, instance, keyPath, snapshotFn) {
      if (keyPath[0] === 'n') {
        return 5;
      } else {
        return snapshotFn();
      }
    }
  ),
  {n: 5, s: 'test', b: true}
);
```

Lastly, we have the `M.Ref` type that ensures that object references survive serialization

```js
myInstance = M({
  r: M.Ref(),
  o: {
    n: Number
  }
}).createInstance();
myInstance.r = myInstance.o;

const myInstanceCopy = new MyClass(myInstance.snapshot());

assert.strictEqual(myInstanceCopy.r, myInstanceCopy.o);
```
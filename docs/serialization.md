# Serialization

Instances initial value can be determined by the class

```js
const MyClass = M({
  props: {
    n: M.Number({initialValue: 3}),
    s: M.String({initialValue: 'test'}),
    b: M.Boolean({initialValue: true})
  }
});
const myInstance = new MyClass();

assert.deepEqual(
  myInstance,
  {n: 3, s: 'test', b: true}
);
```

It can also be overriden in the constructor

```js
assert.deepEqual(
  new MyClass({n: 4, s: 'test2', b: false}),
  {n: 4, s: 'test2', b: false}
);
```

We also have a non-enumerable `snapshot` method that convert the instance into a raw plain object, stripping it from any getters or setters

```js
assert.deepEquals(
  MyClass.createInstance(myInstance.snapshot()),
  myInstance
)
```

You can provide a `mapper` to override the snapshot process

```js
  assert.deepEquals(
    myInstance.snapshot(
      function (opt, instance, keyPath, snapshotFn) {
        if (keyPath[0] === 'n') {
          return 5;
        } else {
          return snapshotFn();
        }
      }
    ),
    {n: 3, s: 'test', b: true}
)
```

Last by not least, we have the `M.Ref` type that ensures that object references survive serialization

```js
const MyClass = M{
  props: {
    r: M.Ref(),
    o: M.Object({
      props: {
        n: M.Number()
      }
    })
  }
}
const myInstance = new MyClass();
myInstance.r = myInstance.o;

const myInstanceCopy = new MyClass(myInstance.snapshot());

assert.strictEqual(myInstanceCopy.r, myInstanceCopy.o);

```
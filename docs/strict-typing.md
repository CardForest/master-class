# Strict Typing

We can generate classes that enforce run-time type checks and prevent object extensions.

```js
const MyClass = M({
  props: {
    str: M.String(),
    arr: M.Array({
      defaultLength: 2,
      elem: M.Number()
    }),
    obj: M({
      props: {
        bool: M.Boolean()
      }
    })
  }
});

const myInstance = new MyClass();
```

Now `myInstance` is a normal javascript object

```js
assert.deepEqual(myInstance, {
  str: '',
  arr: [0, 0],
  obj: {
    bool: false
  }
});
```

that prevents incorrect type assignments:

```js
assert.throws(function() {
  myInstance.obj.bool = 'will throw';
});
```

and object extensions:

```js
assert.throws(function() {
  myInstance.newProperty = 'will throw';
});
```


# Change Control

Using the non-enumerable property `control` we can temporarily prevent changes

```js
const MyClass = M({n: Number});
let myInstance = new MyClass();

myInstance.n = 3;
assert.equal(myInstance.n, 3);

myInstance.control.isChangeAllowed = false;

assert.throws(function() {myInstance.n = 4;});
assert.equal(myInstance.n, 3);
```

This feature is used to enforce no state mutations in getters

```js 
M({
  n: Number,
  get g() {
    // if we would try and assign `this.n = 4`
    // it would throw a run-time exception
    return this.n + 1;
  }
}).createInstance().g;
```
We can also use the `control` object to listen to changes

```js
myInstance.control.on('change', 
  function (changeType, changePayload, opt) {
    // triggered on any direct or nested changes
  }
);
```

Additionally, when we can declare an object methods that may introduce mutations

```js
myInstance = M({
  n: Number,
  m1(x) {
    this.n += x;
  }
}).createInstance();
```

and those can be overridden by the `control`'s `onMutatorCall` method

```js
myInstance.control.onMutatorCall = 
  function (keyPath, args, mutator) {
    // apply the original methd (add args[0] to this.n)
    mutator.apply(this, args); 
    // add another 4 - just because we can
    return this.n += 4; 
  };
    
myInstance.m1(3);
assert.equal(myInstance.n, 7);
```

and be guarded by an [idempotent](https://en.wikipedia.org/wiki/Idempotence) function (ensured internally by `control.isChangeAllowed`)

> Note that to order to pass the `guard` property, we now need to explicitly use `M.Mutator` class factory

```js
myInstance = M({
    n: 5,
    m: M.Mutator({
      guard: function () {
        return this.n < 10;
      },
      fn: function (x) {
        this.n += x;
      }
    })
}).createInstance();

myInstance.m(6);
assert.equal(myInstance.n, 11);

assert.throws(function () {
    myInstance.m(1);
});
assert.equal(myInstance.n, 11);
```
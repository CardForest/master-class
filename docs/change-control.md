# Change Control

Using the non-enumerable property `control` we can temporarily prevent changes

```js
const MyClass = M({
  props: {
    n: M.Number()
  }
});
const myInstance = new MyClass();

myInstance.n = 3;
assert.equal(myInstance.n, 3);

myInstance.control.isChangeAllowed = false;

assert.throws(function() {myInstance.n = 4;});
assert.equal(myInstance.n, 3);
```

This feature is used internally by the `M.Getter` type

```js 
M({
  props: {
    n: M.Number(),
    g: M.Getter(function() {
      // if we would try and assign `this.n = 4`
      // it would throw a run-time exception 
      return this.n + 1;
    })
  }
}).createInstance().g;
```
We can also use the `control` object to listen to changes

```js
myInstance.control.on('change', 
  function (changeType, {newValue, trgKeyPath, key}, opt) {
    // triggered on any direct or nested changes
  }
);
```

Additionally, we have the `M.Mutator` type, which is used to declare any state changing method.

```js
const myInstance = M({
  props: {
    n: M.Number(),
    m1: M.Mutator(function(x) {
      this.n += x;
    })
  }
}).createInstance();
```

Those methods can be overriden by the `control`'s `onMutatorCall` method

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

and be guarded by a [idempotent](https://en.wikipedia.org/wiki/Idempotence) function (assured internally by `control.isChangeAllowed`)

```js
const myInstance = M({
  props: {
    n: M.Number({initialValue: 5}),
    m: M.Mutator({
      guard: function () {return this.n < 10;},
      fn: function(x){
        this.n += x;
      }
    })
  }
}).createInstance();

myInstance.m(6);
assert.equal(myInstance.n, 11);

assert.throws(function () {
    myInstance.m(1);
});
assert.equal(myInstance.n, 11);
```
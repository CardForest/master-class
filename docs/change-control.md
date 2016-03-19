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

and we can listen to changes

```js
myInstance.control.on('change', 
  function (changeType, {newValue, trgKeyPath, key}, opt) {
  
})
```

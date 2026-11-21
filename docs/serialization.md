---
title: Serialization
description: Export a copy for consumers or serialize the full current model for restoration.
---

## Initialize a model

The class schema provides default values:

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

Pass initial values to the constructor or `MyClass.createInstance(data)` to override them:

```js
assert.deepEqual(
  new MyClass({n: 4, s: 'test2', b: false}),
  {n: 4, s: 'test2', b: false}
);
```

## Export a copy

`model.export()` returns a plain copy of the model data, without live
getters or mutators. It flattens active state delegates: if two delegates
define the same field, the copy contains only one value. `snapshot()` is a
deprecated alias for `export()`.
`export` and `serialize` are reserved names on root models.

Pass a compatible export to `createInstance()` to initialize a new model, not
to recover information missing from the export:

```js
assert.deepEqual(
  MyClass.createInstance(myInstance.export()),
  myInstance
);
```

An optional `mapper` receives the schema options, live value, key path, and a
`copy()` callback. Call `copy()` to continue exporting normally or return a
replacement to skip the subtree. Do not mutate the live value or return it
directly if you want a detached result.

```js
assert.deepEqual(
  myInstance.export(
    function (opt, instance, keyPath, copy) {
      if (keyPath[0] === 'n') {
        return 5;
      } else {
        return copy();
      }
    }
  ),
  {n: 5, s: 'test', b: true}
);
```

A mapper can change the shape of the export. For example, if it replaces a
nested object with `"hidden"`, `createInstance(data)` keeps that placeholder
rather than recreating the object. In an object initializer, `"$hidden"` skips
that property's definition. Not every mapped export is a valid initializer.

## Save and restore current state

`model.serialize()` returns a versioned JSON string. Restore it with
`Model.deserialize(data)` using the same schema, including the same delegate
order and consistent state predicates. It preserves each active delegate's values separately, even when
one delegate hides another's field. Internal references reconnect to the
corresponding objects in the new model, not to the original ones.

```js
const WithReference = M({
  r: M.Ref(),
  o: {
    n: Number
  }
});
myInstance = WithReference.createInstance();
myInstance.r = myInstance.o;

const myInstanceCopy = WithReference.deserialize(myInstance.serialize());

assert.strictEqual(myInstanceCopy.r, myInstanceCopy.o);
```

Serialization captures current data, not discarded inactive delegates,
watchers, or event listeners. On restore, the schema rebuilds behavior, and
delegates that activate later start from their schema defaults. References to
objects outside the current model are not supported. Unlike a filtered export,
the serialized data contains hidden values from active delegates: do not share
it with consumers who should not see that data.
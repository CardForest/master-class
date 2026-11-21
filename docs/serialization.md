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
define the same field, only its live owner can contribute that field. If the
winner is a getter, mutator, or is filtered out, an earlier value is not
revealed. `snapshot()` is a
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

For example, a server can send a JSON-safe player export with `"$hidden"`
in place of the opponent's cards. A client can display that data directly or
initialize a compatible model from it. An absent property can take its schema
default on construction; it is not the same as an explicit `"$hidden"`.
This is not a game save, and arbitrary mapper results need not survive JSON.
If a mapper replaces an entire **delegate** with a scalar, it contributes no
fields: the delegate is flattened and has no property to hold the scalar.

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

Serialization captures current delegate data and the initializer a state
will use the next time a delegate activates. For example, if a score defaults
to `1`, was initialized to `9`, and is now `42`, a restore resumes at `42`.
Leaving and re-entering that state resets it to `9`, just as in the original.
It does not save discarded delegates, watchers, event listeners, or changes
to external inputs after the save. State initializers must be acyclic plain
data (not live model objects, functions, or accessors).

Save the complete authoritative model, not a projection with missing fields or
replacement placeholders. `serialize()` and `deserialize()` reject those
incomplete shapes rather than inventing data. References cannot point outside
the current model: if a selected object leaves the model, assign `null` to its
reference before saving. Saves contain private delegate values **and state
initializers**; do not send them to players.

**Format compatibility:** new saves use format 2. This reader also accepts
complete 0.6.0 (format 1) saves. Those saves had no initializer data, so
later activations use schema defaults; the original initializer cannot be
recovered. A 0.6.0 reader cannot load format 2.
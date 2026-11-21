---
title: Getting Started
description: JavaScript classes with an edge.
---

Master-Class creates JavaScript classes with runtime strict typing, fine-grained
change control, serialization, and hierarchical state machines.

## Install

Latest tested on Node.js 24.

```sh
npm install master-class
```

## Create a class

```js
const M = require('master-class');

const Person = M({
  name: String,
  age: Number,
  birthday(years) {
    this.age += years;
  }
});

const person = new Person({name: 'Ada', age: 36});
person.birthday(1);
console.log(person.age); // 37
```

You can also construct instances with `Person.createInstance()`.

## TypeScript

The package includes TypeScript declarations. Install `@types/node` and add
`"types": ["node"]` to your TypeScript compiler options.

```ts
import M = require('master-class');

const Person = M({
  name: String,
  age: Number,
  birthday(years: number) {
    this.age += years;
  }
});

const person = new Person({name: 'Ada', age: 36});
person.birthday(1);
// person.age = 'wrong'; // Rejected by TypeScript and at runtime.
```

Primitive, object, array, getter, and mutator types are inferred from schemas.
State properties and exports are dynamic and exposed as `unknown`.

## Guides

- [Strict typing](./strict-typing.md)
- [Change control](./change-control.md)
- [Serialization](./serialization.md)
- [The state pattern](./state-pattern.md)

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).

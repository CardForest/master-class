# Master-Class

> Stateful JavaScript models: share a view, save the full state.


Master-Class lets you define which fields and actions a JavaScript object has
in each state. Export a filtered copy for a client, or serialize the full
model to pick up where you left off. An approval workflow might show an
applicant the decision without the reviewer's notes; a card game might show
each player their hand without revealing anyone else's.

#  [![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url]


## Install

Latest tested on Node.js 24. The package remains CommonJS and includes TypeScript declarations.

```sh
$ npm install master-class
```


## Example: deal two cards, send one player's view

```js
const M = require('master-class');
const Game = M({players: [{card: M.String({scope: 'owner'})}]});
const game = new Game({players: [{card: 'Ace'}, {card: 'King'}]});

const view = game.export((options, value, path, copy) =>
  options.scope === 'owner' && path[1] !== 0 ? 'face down' : copy()
);
console.log(JSON.stringify(view)); // {"players":[{"card":"Ace"},{"card":"face down"}]}

const saved = game.serialize();    // Keep on the server, not in the player message.
console.log(Game.deserialize(saved).players[1].card); // King
```

The mapper enforces the visibility rule; `scope` is your label, not a built-in
permission. [Play through the reveal](docs/index.md) to see how `M.State`
changes the available moves and how to restore the turn before the reveal.

## <a name="Features"></a>Features

* [Run-time strict typing](docs/strict-typing.md)
* [Fine-grained change control](docs/change-control.md)
* [Serialization](docs/serialization.md)
* [The state pattern](docs/state-pattern.md)

## API Reference

[WIP] For now, you could just read through the [tests](https://github.com/CardForest/master-class/tree/master/test).

## Documentation website

The guides are published at [cardforest.github.io/master-class](https://cardforest.github.io/master-class/).
The React site uses Fumadocs and Next.js static export; Markdown in `docs/` is
the single source of truth. The old GitBook configuration has been removed.
Building the documentation website requires Node.js 24 or newer.

```sh
cd website
npm ci
npm run dev
```

Open `http://localhost:3000/master-class/`. To validate and export the site:

```sh
npm run typecheck
npm run build
npm test
```

The build writes static HTML, assets, and browser-side search data to `website/out/`.
Navigation uses ordinary links and full-page loads, without requiring a Next.js
server or its client-side route prefetch transport.
The separate website package does not add dependencies to the published library.
The documentation workflow checks pull requests and deploys updates on `master`
to GitHub Pages. In repository Settings > Pages, the source must be **GitHub Actions**.
It can also be deployed with the workflow's **Run workflow** action.

## TypeScript

For TypeScript consumers, install `@types/node` and include `"types": ["node"]`
in your `tsconfig.json` compiler options; the control API extends Node's `EventEmitter`.

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
// person.age = 'wrong'; // TypeScript error, also rejected at runtime
```

Primitive, object, array, getter, and mutator types are inferred from schemas.
State properties are dynamic and exposed as `unknown`; narrow them before use.
Only root models expose `control`, `export()` and `serialize()`. Managed arrays
have writable elements but a fixed length per instance.
Use `export(mapper?)` for a plain copy (formerly `snapshot()`), or
`Model.deserialize(model.serialize())` for a full current-state round-trip.
Exports return `unknown`: mapped exports can replace or omit fields, so
`createInstance(data)` returns `unknown` when the input isn't known to match
the schema. See the [serialization guide](docs/serialization.md).
Unsupported schemas (including empty array schemas) throw `TypeError`.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
npm pack
```

TypeScript sources live in `src/`; the build emits CommonJS JavaScript and declarations
into `dist/`. `npm test` builds first and runs the regression suite using Node's
built-in test runner. Browser testing and the legacy Karma, Browserify, JSHint,
and Travis configuration have been removed. GitHub Actions validates Node 24 on
Linux and Windows. `npm pack` validates types and tests before packaging the build.

The dependency on `key-path` 0.5.0 uses its bundled TypeScript declarations.
That release must be available in your npm registry for `npm ci` to succeed.

The repository's `index.js` forwards to the build for existing relative imports.
Internal source paths have moved from `lib/` to `src/lib/`; compiled internal
modules are under `dist/lib/`.

## License

[AGPL-3.0](http://www.gnu.org/licenses/agpl-3.0.en.html) © [Amit Portnoy](https://github.com/amitport)

[npm-image]: https://badge.fury.io/js/master-class.svg
[npm-url]: https://npmjs.org/package/master-class
[ci-image]: https://github.com/CardForest/master-class/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/CardForest/master-class/actions/workflows/ci.yml

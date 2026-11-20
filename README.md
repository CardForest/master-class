# Master-Class

> JavaScript classes with an edge.


This library provides a [class](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes) [factory](https://en.wikipedia.org/wiki/Factory_%28object-oriented_programming%29). The instances of its generated classes have [many features](#Features) that will eventually allow them to:

- Be distributively managed between machines
- Be differently viewed in different contexts (e.g., depending on the viewer or an internal state)
- Be efficiently stored
- Keep precise track of their changes

 All while still feeling like plain JavaScript objects.

#  [![NPM version][npm-image]][npm-url] [![Build Status][ci-image]][ci-url]


## Install

Requires Node.js 24 or newer. The package remains CommonJS and includes TypeScript declarations.

```sh
$ npm install master-class
```


## Usage

0. Require the library

    ```js
    const M = require('master-class');
    ```
0. Create a new class:

    ```js
    const MyMClass = M({/* options */});
    ```
0. Create an instance:

    ```js
    const myInstance = new MyMClass();
    ```
    or
    ```js
      const myInstance = MyMClass.createInstance();
    ```

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
Snapshots also return `unknown`, because custom mappers can replace values with arbitrary data.
Factory initialization accepts snapshot data and validates it at runtime.
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

# Mater-Class

> JavaScript classes with an edge.


This is library provides an [ECMAScript 6 class](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes) [factory](https://en.wikipedia.org/wiki/Factory_%28object-oriented_programming%29). The instances of  its generated classes have *"magic"* [Features](#Features).

#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

## Install

```sh
$ npm install --save master-class
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
* [The State pattern](docs/state-pattern.md)

## API

This section is in progress, but you can probably can ahead by following the [tests](/test).

## License

[AGPL-3.0](http://www.gnu.org/licenses/agpl-3.0.en.html) © [Amit Portnoy](https://github.com/amitport)

[npm-image]: https://badge.fury.io/js/master-class.svg
[npm-url]: https://npmjs.org/package/master-class
[travis-image]: https://travis-ci.org/CardForest/master-class.svg?branch=master
[travis-url]: https://travis-ci.org/CardForest/master-class
[daviddm-image]: https://david-dm.org/CardForest/master-class.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/CardForest/master-class

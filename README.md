# Mater-Class

> JavaScript classes with an edge.


This is library provides an [ECMAScript 6 class](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes) [factory](https://en.wikipedia.org/wiki/Factory_%28object-oriented_programming%29). The instances of  its generated classes have *magic* features.

#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

## Install

```sh
$ npm install --save master-class
```


## Usage

```js
const M = require('master-class');
```

```js
const MyMClass = M({
  props: {
    myString: M.String(),
    myNumber: M.Number({initialValue: 5}),
    mySubObject: M.Object({
      props: {
        subObjectBoolean: M.Boolean()
      }
    })
  }
});

const myInstance = new MyMClass(); // equivalent to MyMClass.createInstance();

assert.deepEqual(myInstance, {
  myString: '',
  myNumber: 5,
  mySubObject: {subObjectBoolean: false}
});
```

## License

[AGPL-3.0](http://www.gnu.org/licenses/agpl-3.0.en.html) © [Amit Portnoy](https://github.com/amitport)

[npm-image]: https://badge.fury.io/js/master-class.svg
[npm-url]: https://npmjs.org/package/master-class
[travis-image]: https://travis-ci.org/CardForest/master-class.svg?branch=master
[travis-url]: https://travis-ci.org/CardForest/master-class
[daviddm-image]: https://david-dm.org/CardForest/master-class.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/CardForest/master-class

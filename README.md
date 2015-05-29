#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> JavaScript classes with an edge.


## Install

```sh
$ npm install --save master-class
```


## Usage

```js
var M = require('master-class')

var myClassOpts = {
  props: {
    stage: M.String(),
    stash: M.Object({
     props: {
        size: M.Number({initialValue: 5}),
        isEmpty: M.Getter(function() {return this.lefth === 0;}),
        addSome: M.Mutator(function (some) {
          this.size += some;
        })
      }
    }),
    players: M.Array({
      defaultLength: 2,
      elem: M.Object({
        props: {
          bid: M.Number(),
          secret: M.Boolean({scope: 'player'})
        }
      })
    }),
    currentPlayer: M.Ref()
  }
}

var control = {};
  
var instance = M(myClassOpts).createInstance(
  {stage: 'start'}, // initial value (or previous snapshot)
  control
)

// instance is just normal object
instance.players[1].bid = 2
console.log(instance)
// prints:
//{
//  stage: 'start',
//  stash: {
//    size: 5,
//    isEmpty: false
//  },
//  players: [{
//    bid: 0,
//    secret: false
//  }, {
//    bid: 2,
//    secret: false
//  }],
//  currentPlayer: null
//}

// but the control object has control!

// it can prevent changes
control.isChangeAllowed = false 
instance.stage = 'end' // throws exception!
control.isChangeAllowed = true 

// it can listen to changes
control.onChange: function(type, payload, factoryOpts){
      if (type === 'setValue')
        console.log(payload.trgKeyPath.join('.') + "'s '" + payload.key + "' property was set with " + payload.newValue);
  }
}

instance.stash.size = 2 // logs: "stash's 'size' property was set with 2"

// it can override mutator calls 
control.onMutatorCall = function (keyPath, args, mutator) {
  if (this.size + args[0] <= 10) {
    mutator.apply(this, args)
  } else {
    throw Error('oh no we passed 10')
  }
}
instance.stash.addSome(4) // we're OK => and stash.size is updated 9
instance.stash.addSome(2) // throws error and stash.size is not updated

// M.Ref designates that the property references another object
instance.currentPlayer = instance.players[0]
// this is useful when we make a snapshot of this instance
var snapshot = instance.snapshot()
// a snapshot is a plain js object that can be sent over the network
// and be used to retrive the object state later
var sameInstance = M(
  myClassOpts, // we could use different opts to agument the behaviour
  snapshot
)
// sameInstance deep equals instance
// and more importantly, instance.currentPlayer === instance.players[0] !

// Additionally, the instance can receive a mapper-visitor function that lets us tap into it
 var snapshotWithoutPlayerScope = instance.snapshot(
  function (opt, instance, keyPath, snapshotFn) {
    if (opt.scope === 'player') {
      return 'hidden';
    } else {
      return snapshotFn()
  }
)

// snapshotWithoutPlayerScope.players[ ].secret is always 'hidden'
```

Sorry, that's all the documentation for now (check out the tests for more), but trust me, this is worth looking into (and perhaps contribute to ;-) ).

## License

AGPL © [Amit Portnoy](https://github.com/amitport)

[npm-image]: https://badge.fury.io/js/master-class.svg
[npm-url]: https://npmjs.org/package/master-class
[travis-image]: https://travis-ci.org/CardForest/master-class.svg?branch=master
[travis-url]: https://travis-ci.org/CardForest/master-class
[daviddm-image]: https://david-dm.org/CardForest/master-class.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/CardForest/master-class

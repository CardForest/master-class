'use strict';

var assert = require('assert');
var M = require('..');

// TODO automate the synchronization between this and the readme
describe('readme example', function () {
  it("should run without errors", function () {
    var myFactory = M({
      props: {
        stage: M.String(),
        stash: M.Object({
          props: {
            size: M.Number({initialValue: 5}),
            isEmpty: M.Getter(function () {
              return this.size === 0;
            }),
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
    });

    var instance = myFactory.createInstance(
      {stage: 'start'} // we can provide initial value
    );

    // instance is generally a normal object

    instance.players[1].bid = 2;
    assert.deepEqual(instance,
      {
        stage: 'start',
        stash: {
          size: 5
        },
        players: [{
          bid: 0,
          secret: false
        }, {
          bid: 2,
          secret: false
        }],
        currentPlayer: null
      }
    );

    // but its hidden _control_ attribute has control!

    // it can prevent changes
    instance.control.isChangeAllowed = false;
    assert.throws(() => {
      instance.stage = 'end';
    });

    instance.control.isChangeAllowed = true;

    // it can listen to changes
    instance.control.on('change', function (type, payload) {
      if (type === 'setValue') {
        console.log(payload.trgKeyPath.join('.') + "'s '" + payload.key +
          "' property was set with " + payload.newValue);
      }
    });
    instance.stash.size = 2; // logs "stash's 'size' property was set with 2"

    // it can override object mutations
    instance.control.onMutatorCall = function (keyPath, args, mutator) {
      if (this.size + args[0] <= 10) {
        mutator.apply(this, args);
      } else {
        throw Error('oh no we passed 10');
      }
    };

    instance.stash.addSome(7); // we're OK => and stash.size is updated 9
    assert.throws(() => {
      instance.stash.addSome(2);
    }); // throws error and stash.size is not updated

    // M.Ref designates that the property references another object
    instance.currentPlayer = instance.players[0];
    // this is useful when we make a snapshot of this instance
    var snapshot = instance.snapshot();
    // a snapshot is a plain js object that can be sent over the network and be used to retrieve the object state later
    var instanceCopy = myFactory.createInstance(snapshot);
    //  now instanceCopy deep equals instance
    assert.deepEqual(instanceCopy, instance);
    // and more importantly, instanceCopy.currentPlayer === instanceCopy.players[0] !
    assert.strictEqual(instanceCopy.currentPlayer, instanceCopy.players[0]);
    // Additionally, the snapshot function can receive a mapper-visitor function that lets us "tap" into it
    var snapshotWithoutPlayerScope = instance.snapshot(
      function (opt, instance, keyPath, snapshotFn) {
        if (opt.scope === 'player') {
          return 'hidden';
        } else {
          return snapshotFn();
        }
      }
    );

    assert.strictEqual(snapshotWithoutPlayerScope.players[0].secret, 'hidden');
  });
});

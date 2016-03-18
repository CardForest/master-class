'use strict';

var assert = require('assert');
var sinon = require('sinon');

var M = require('..');
var snapshotUtil = require('../lib/types/snapshotUtil');

describe('snapshot', function () {
  it('copy object with primitive properties', function () {
    var o =
      M({
        props: {
          n: M.Number({initialValue: 3}),
          s: M.String({initialValue: 'test'}),
          b: M.Boolean({initialValue: true})
        }
      }).createInstance();

    assert.deepEqual(o.snapshot(), {n: 3, s: 'test', b: true});
  });

  it('copy object with nested object', function () {
    var o = M({
      props: {
        o: M.Object({
          props: {
            n: M.Number({initialValue: 3})
          }
        })
      }
    }).createInstance();

    assert.deepEqual(o.snapshot(), {o: {n: 3}});
  });

  it('copy object with nested array', function () {
    var o = M({
      props: {
        a: M.Array({
          defaultLength: 2,
          elem: M.Number({initialValue: 3})
        })
      }
    }).createInstance();

    assert.deepEqual(o.snapshot(), {a: [3, 3]});
  });

  it('copy object with nested array with object element', function () {
    var o = M({
      props: {
        a: M.Array({
          defaultLength: 2,
          elem: M.Object({
            props: {
              n: M.Number({initialValue: 3})
            }
          })
        })
      }
    }).createInstance();

    assert.deepEqual(o.snapshot(), {a: [{n: 3}, {n: 3}]});
  });

  it('does not include getters or mutators', function () {
    var o = M({
      props: {
        g: M.Getter(function() {
          return this.n + 1;
        }),
        m: M.Mutator(function(x) {
          this.n = this.n + x;
        })
      }
    }).createInstance();

    assert.deepEqual(o.snapshot(), {});
  });

  it('can restore object from snapshot', function () {
    var opt = {
      props: {
        n: M.Number(),
        o: M.Object({
          props: {
            a: M.Array({
              defaultLength: 2,
              elem: M.Object({
                props: {
                  n: M.Number()
                }
              })
            })
          }
        })
      }
    };

    var o = M(opt).createInstance();
    o.n = 3;
    o.o.a[0].n = 4;
    o.o.a[1].n = 5;

    assert.deepEqual(o, {n: 3, o: {a: [{n: 4}, {n: 5}]}});

    var oCopy = M(opt).createInstance(o.snapshot());

    assert.deepEqual(oCopy, o);
  });

  it('call mapper on every property', function () {
    var mapperSpy = sinon.spy(snapshotUtil.noOpMapper);

    var o =
      M({
        props: {
          o: M.Object({
            props: {
              a: M.Array({
                defaultLength: 1,
                elem: M.Number({initialValue: 3, extraOption: 'n-extra'}),
                extraOption: 'a-extra'
              })
            },
            extraOption: 'o-extra'
          })
        }
      }).createInstance();

    o.snapshot(mapperSpy);

    assert.strictEqual(mapperSpy.callCount, 3); // called for 'o', 'o.a' and 'o.a[0]'

    assert.strictEqual(mapperSpy.firstCall.args.length, 4);
    assert.strictEqual(mapperSpy.firstCall.args[0].extraOption, 'o-extra'); // first arg is the property options
    assert.strictEqual(mapperSpy.firstCall.args[1].a[0], 3); // second arg is the property value (which is o.o)
    assert.deepEqual(mapperSpy.firstCall.args[2], ['o']); // third arg is the keyPath
    assert.strictEqual(typeof mapperSpy.firstCall.args[3], 'function'); // forth arg is the continuation function

    assert.strictEqual(mapperSpy.secondCall.args.length, 4);
    assert.strictEqual(mapperSpy.secondCall.args[0].extraOption, 'a-extra'); // first arg is the property options
    assert.strictEqual(mapperSpy.secondCall.args[1][0], 3); // second arg is the property value (which is o.o.a)
    assert.deepEqual(mapperSpy.secondCall.args[2], ['o', 'a']); // third arg is the keyPath
    assert.strictEqual(typeof mapperSpy.secondCall.args[3], 'function'); // forth arg is the continuation function

    assert.strictEqual(mapperSpy.thirdCall.args.length, 4);
    assert.strictEqual(mapperSpy.thirdCall.args[0].extraOption, 'n-extra'); // first arg is the property options
    assert.strictEqual(mapperSpy.thirdCall.args[1], 3); // second arg is the property value (which is o.o.a[0])
    assert.deepEqual(mapperSpy.thirdCall.args[2], ['o', 'a', 0]); // third arg is the keyPath
    assert.strictEqual(typeof mapperSpy.thirdCall.args[3], 'function'); // forth arg is the continuation function
  });

  it('mapper can alter the returned value', function () {
    var o =
      M({
        props: {
          n: M.Number({initialValue: 3}),
          s: M.String({initialValue: 'test'}),
          b: M.Boolean({initialValue: true})
        }
      }).createInstance();

    var s = o.snapshot(function (opt, instance, keyPath, snapshotFn) {
      if (keyPath[0] === 'n') {
        return 5;
      } else {
        return snapshotFn();
      }
    });

    assert.deepEqual(s, {n: 5, s: 'test', b: true});
  });

  it('supports TBS use case', function () {
    var opt = {
      props: {
        secretObject: M.Object({
          props: {
            s: M.String({initialValue: 'secret'})
          },
          scope: 'master'
        }),
        secretArray: M.Array({
          defaultLength: 2,
          elem:  M.String({initialValue: 'secret'}),
          scope: 'master'
        }),
        notSecret: M.String({initialValue: 'notSecret'}),
        players: M.Array({
          defaultLength: 2,
          elem: M.Object({
            props: {
              secret: M.String({initialValue: 'secret', scope: 'player'}),
              notSecret: M.String({initialValue: 'notSecret'})
            }
          })
        })
      }
    };

    var o = M(opt).createInstance();

    var playerScopeMapper = function (playerIdx) {
      return function (opt, instance, keyPath, snapshotFn) {
        if (opt.scope === 'master') {
          return 'hidden';
        } else if (opt.scope === 'player') {
          if (keyPath.length < 2 || keyPath[0] !== 'players') {
            throw Error('the \'player\' scope must be used inside of the \'players\' array');
          } else {
            if (keyPath[1] !== playerIdx) {
              return 'hidden';
            }
          }
        }
        return snapshotFn();
      };
    };

    var player0Snapshot = o.snapshot(playerScopeMapper(0));
    var player1Snapshot = o.snapshot(playerScopeMapper(1));

    assert.deepEqual(player0Snapshot, {
        secretObject: {$override: 'hidden'},
        secretArray: {$override: 'hidden'},
        notSecret: 'notSecret',
        players: [
          {secret: 'secret', notSecret: 'notSecret'},
          {notSecret: 'notSecret', secret: 'hidden'}
        ]}
    );
    assert.deepEqual(player1Snapshot, {
        secretObject: {$override: 'hidden'},
        secretArray: {$override: 'hidden'},
        notSecret: 'notSecret',
        players: [
          {secret: 'hidden', notSecret: 'notSecret'},
          {notSecret: 'notSecret', secret: 'secret'}
        ]}
    );
    assert.deepEqual(M(opt).createInstance(player0Snapshot), player0Snapshot);
  });

});

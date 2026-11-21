'use strict';
const { describe, it } = require('node:test');

var assert = require('assert');
var sinon = require('sinon');

var M = require('..');

describe('snapshot', function () {
  it('exports a detached copy and keeps snapshot as an alias', function () {
    const model = M({items: [{number: Number}]}).createInstance({items: [{number: 3}]});
    const view = model.export();
    assert.deepStrictEqual(view, model.snapshot());
    view.items[0].number = 99;
    assert.strictEqual(model.items[0].number, 3);
    assert.deepStrictEqual(model.export((_options, _value, path, copy) =>
      path[0] === 'items' ? 'hidden' : copy()), {items: 'hidden'});
  });

  it('round-trips a root array with model values that JSON alone would change', function () {
    const Model = M([{label: String, number: Number}]);
    const model = Model.createInstance([{number: NaN}]);
    model[0].label = '$hidden';
    const restored = Model.deserialize(model.serialize());
    assert.deepStrictEqual(restored.export(), [{label: '$hidden', number: NaN}]);
    assert.throws(() => Model.deserialize('{"version":3}'), /unsupported serialized model data/);
  });

  it('loads complete v1 saves but never returns a typed model from a partial save', function () {
    const Game = M({piece: {score: Number}});
    const legacy = {version: 1, root: {kind: 'object', id: 0, fields: {
      piece: {kind: 'object', id: 1, fields: {score: 8}}
    }}};
    assert.strictEqual(Game.deserialize(JSON.stringify(legacy)).piece.score, 8);
    for (const value of ['$hidden', 'placeholder']) {
      assert.throws(() => Game.createInstance({piece: value}).serialize(), /projected model/);
    }
    legacy.root.fields.piece = 'placeholder';
    assert.throws(() => Game.deserialize(JSON.stringify(legacy)), /schema/);
    delete legacy.root.fields.piece;
    assert.throws(() => Game.deserialize(JSON.stringify(legacy)), /schema/);
  });

  it('can transport a compatible hand projection without exposing opponent cards', function () {
    const Game = M({players: [{hand: M.Array({defaultLength: 0, elem: M.Number({scope: 'player'})})}]});
    const game = Game.createInstance({players: [{hand: [3]}, {hand: [7, 8]}]});
    const wire = JSON.parse(JSON.stringify(game.export((options, _, path, copy) =>
      options.scope === 'player' && path[1] !== 0 ? '$hidden' : copy())));
    assert.deepStrictEqual(wire.players[1].hand, ['$hidden', '$hidden']);
    const player = Game.createInstance(wire);
    assert.strictEqual(player.players[0].hand[0], 3);
    assert.deepStrictEqual(Object.keys(player.players[1].hand), []);
    assert.throws(() => player.serialize(), /missing fields/);
  });

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
    var mapperSpy = sinon.spy(function noOpMapper(opt, instance, keyPath, snapshotFn) {
      return snapshotFn();
    });

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
        secretObject: 'hidden',
        secretArray: 'hidden',
        notSecret: 'notSecret',
        players: [
          {secret: 'secret', notSecret: 'notSecret'},
          {notSecret: 'notSecret', secret: 'hidden'}
        ]}
    );
    assert.deepEqual(player1Snapshot, {
        secretObject: 'hidden',
        secretArray: 'hidden',
        notSecret: 'notSecret',
        players: [
          {secret: 'hidden', notSecret: 'notSecret'},
          {notSecret: 'notSecret', secret: 'secret'}
        ]}
    );
    assert.deepEqual(M(opt).createInstance(player0Snapshot), player0Snapshot);
    assert.deepEqual(M(opt).createInstance(player0Snapshot).snapshot(), player0Snapshot);
  });

});

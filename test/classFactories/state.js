'use strict';
const { describe, it } = require('node:test');

var assert = require('assert');
var M = require('../..');

describe('state', function () {
  it('round-trips a hierarchy with multiple top-level delegates', function () {
    const options = [
      {delegate: M({a: 1}), subState: [{delegate: M({b: 2})}]},
      {delegate: M({c: 3})}
    ];
    options.forEach((state) => Object.freeze(state));
    Object.freeze(options[0].subState[0]);
    const Model = M({state: M.State(options)});
    const original = Model.createInstance();
    original.state.b = 7;

    const snapshot = original.snapshot();
    assert.deepEqual(snapshot, {state: {a: 1, b: 7, c: 3}});
    assert.deepEqual(Model.createInstance(snapshot).snapshot(), snapshot);
  });

  it('serializes overlapping delegates and keeps references to the hidden one', function () {
    const Model = M({
      overlay: Boolean,
      ref: M.Ref(),
      state: M.State([
        {delegate: M({}), subState: [{delegate: M({item: {score: 1}})}]},
        {when() { return this.root.overlay; }, delegate: M({item: {score: 2}})}
      ])
    });
    const game = Model.createInstance();
    game.state.item.score = 10;
    game.ref = game.state.item;
    game.overlay = true;
    game.state.item.score = 20;

    const restored = Model.deserialize(game.serialize());
    assert.deepStrictEqual(restored.export(), game.export());
    assert.strictEqual(restored.state.item.score, 20);
    assert.strictEqual(restored.ref.score, 10);
    assert.notStrictEqual(restored.ref, game.ref);
    restored.overlay = false;
    assert.strictEqual(restored.state.item, restored.ref);
  });

  it('stops running watchers for replaced states and abandoned subtrees', function () {
    const visited = new Set();
    const State = M.State([{
      when() { visited.add(this); return true; },
      delegate: M({n: Number})
    }]);
    const Model = M({direct: State, nested: [{state: State, n: Number}], tick: Number});
    const model = Model.createInstance();
    const oldDirect = model.direct;
    const oldNested = model.nested[0].state;

    // Initializing a replacement fails after its first watcher is registered.
    assert.throws(() => { model.nested = [{n: 'wrong'}]; }, TypeError);
    assert.strictEqual(model.nested[0].state, oldNested);
    visited.clear();
    model.tick++;
    assert.deepEqual(visited, new Set([oldDirect, oldNested]));

    model.direct = {n: 1};
    model.nested = [{state: {n: 2}}];
    visited.clear();
    model.tick++;
    assert.deepEqual(visited, new Set([model.direct, model.nested[0].state]));
    assert.ok(!visited.has(oldDirect) && !visited.has(oldNested));
  });

  it('disposes nested state watchers when their delegate goes inactive', function () {
    const visited = new Set();
    const child = M.State([{
      when() { visited.add(this); return true; },
      delegate: M({n: Number})
    }]);
    const model = M({
      enabled: true,
      parentState: M.State([{
        when() { return this.root.enabled; },
        delegate: M({child})
      }])
    }).createInstance();
    assert.ok(visited.has(model.parentState.child));

    model.enabled = false;
    visited.clear();
    model.control.digest();
    assert.strictEqual(visited.size, 0);
    assert.strictEqual(model.parentState.child, undefined);
  });

  it('passes through a single object', function () {
    var o = M({
      props: {
        state: M.State([
          {
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, 3);
  });

  it('merges two objects', function () {
    var o = M({
      props: {
        state: M.State([
          {
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            delegate: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, 3);
    assert.strictEqual(o.state.m, 1);
  });

  it('avoid merge on predicate', function () {
    var o = M({
      props: {
        flag: M.Boolean(),
        state: M.State([
          {
            when() {
              return this.root.flag;
            },
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            when() {
              return !this.root.flag;
            },
            delegate: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, undefined);
    assert.strictEqual(o.state.m, 1);

    o.flag = true;

    assert.strictEqual(o.state.n, 3);
    assert.strictEqual(o.state.m, undefined);
  });

  it('supports snapshot round-trip', function () {
    var opt = {
      props: {
        state: M.State([
          {
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            delegate: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    };
    var o = M(opt).createInstance();
    var oCopy = M(opt).createInstance(o.snapshot());

    assert.deepEqual(oCopy, o);
  });

  describe('sub-state', function () {
    it('merges with parent', function () {
      var o = M({
        props: {
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, 5);
    });

    it('overrides parent state', function () {
      var o = M({
        props: {
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                delegate: M.Object({
                  props: {
                    n: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, 5);
    });

    it('respects predicate', function () {
      var o = M({
        props: {
          flag: M.Boolean(),
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                when() {
                  return this.root.flag;
                },
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.m, undefined);
      o.flag = true;
      assert.strictEqual(o.state.m, 5);
    });

    it('respects parent predicate', function () {
      var o = M({
        props: {
          flag: M.Boolean(),
          state: M.State([
            {
              when() {
                return this.root.flag;
              },
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3}),
                  flag2: M.Boolean()
                }
              }),
              subState: [{
                when() {
                  return this.flag2;
                },
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, undefined);
      assert.strictEqual(o.state.m, undefined);
      o.flag = true;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, undefined);
      o.state.flag2 = true;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, 5);
      o.state.flag2 = false;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, undefined);
    });

  });
});

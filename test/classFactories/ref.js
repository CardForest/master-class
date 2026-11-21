'use strict';
const { describe, it } = require('node:test');

var assert = require('assert');
var M = require('../..');

describe('ref', function () {
  it('accepts null options', function () {
    const o = M({r: M.Ref(null)}).createInstance();
    assert.strictEqual(o.r, null);
  });

  it('restores references through array indices and literal property names', function () {
    const Model = M({
      r: M.Ref(),
      items: [{'a.b': {n: Number}}]
    });
    const original = Model.createInstance();
    original.items[0]['a.b'].n = 7;
    original.r = original.items[0]['a.b'];

    const restored = Model.createInstance(original.snapshot());
    assert.strictEqual(restored.r, restored.items[0]['a.b']);
    assert.strictEqual(restored.r.n, 7);
  });

  it('restores independent references from the same immutable snapshot', function () {
    const Model = M({r: M.Ref(), child: {n: Number}});
    const source = Model.createInstance();
    source.r = source.child;
    const snapshot = source.snapshot();
    assert.notStrictEqual(snapshot.r.keyPath, source.child.keyPath);
    Object.freeze(snapshot.r);

    const first = Model.createInstance(snapshot);
    const second = Model.createInstance(snapshot);
    assert.strictEqual(first.r, first.child);
    assert.strictEqual(second.r, second.child);
    assert.notStrictEqual(first.r, second.r);
    assert.deepEqual(snapshot.r, {keyPath: ['child']});
  });

  it('links with the referred object', function () {
    var opt = {
      props: {
        r: M.Ref(),
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    };

    var o = M(opt).createInstance();

    assert.strictEqual(o.r, null);
    o.r = o.o;

    o.o.n = 3;
    assert.strictEqual(o.r.n, 3);

    o.r.n = 2;
    assert.strictEqual(o.o.n, 2);

    assert.strictEqual(o.r, o.o);
  });

  it('links work transitively', function () {
    var opt = {
      props: {
        r1: M.Ref(),
        r2: M.Ref(),
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    };

    var o = M(opt).createInstance();

    o.r2 = o.r1 = o.o;

    o.o.n = 3;
    assert.strictEqual(o.r1.n, 3);
    assert.strictEqual(o.r2.n, 3);

    o.r1.n = 2;
    assert.strictEqual(o.o.n, 2);
    assert.strictEqual(o.r2.n, 2);

    o.r2.n = 1;
    assert.strictEqual(o.o.n, 1);
    assert.strictEqual(o.r1.n, 1);

    assert.strictEqual(o.o, o.r1);
    assert.strictEqual(o.r1, o.r2);
  });

  it('links survive snapshots', function () {
    var opt = {
      props: {
        r: M.Ref(),
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    };

    var origin = M(opt).createInstance();
    origin.r = origin.o;
    origin.o.n = 4;

    var o = M(opt).createInstance(origin.snapshot());

    assert.deepEqual(o, origin);

    assert.strictEqual(o.r.n, 4);

    o.r.n = 5;
    assert.strictEqual(o.o.n, 5);

    assert.strictEqual(o.r, o.o);
  });

  it('transitive links survive snapshots ', function () {
    var opt = {
      props: {
        r1: M.Ref(),
        r2: M.Ref(),
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    };

    var origin = M(opt).createInstance();
    origin.r2 = origin.r1 = origin.o;
    origin.o.n = 3;

    var o = M(opt).createInstance(origin.snapshot());

    assert.deepEqual(o, origin);

    assert.strictEqual(o.r1.n, 3);
    assert.strictEqual(o.r2.n, 3);

    o.r1.n = 2;
    assert.strictEqual(o.o.n, 2);
    assert.strictEqual(o.r2.n, 2);

    o.r2.n = 1;
    assert.strictEqual(o.o.n, 1);
    assert.strictEqual(o.r1.n, 1);

    assert.strictEqual(o.o, o.r1);
    assert.strictEqual(o.r1, o.r2);
  });
});

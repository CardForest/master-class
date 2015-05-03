'use strict';

var assert = require('assert');
var M = require('../..');

describe('ref', function () {
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

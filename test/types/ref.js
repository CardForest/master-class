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

    var o = M(opt).createInstance();

    o.r = o.o;
    assert.strictEqual(o.r, o.o);

    var oCopy = M(opt).createInstance(o.snapshot());

    assert.deepEqual(oCopy, o);

    oCopy.o.n = 4;
    assert.strictEqual(oCopy.r.n, 4);

    oCopy.r.n = 5;
    assert.strictEqual(oCopy.o.n, 5);

    assert.deepEqual(oCopy.r, oCopy.o);
  });
});

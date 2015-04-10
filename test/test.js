'use strict';

var assert = require('assert');

var M = require('..');

describe('property containers', function () {
  it('allows primitive properties', function () {
    var o =
      M({
        props: {
          n: M.Number({initialValue: 3}),
          s: M.Object({
            props: {
              n: M.Number({initialValue: 4}),
              s: M.String(),
              a: M.Array({
                defaultLength: 1,
                elem: M.Number({initialValue: 4}),
              })
            }
          }),
          b: M.Boolean()
        }
      }).createInstance();

    assert.strictEqual(o.n, 3);
    assert.strictEqual(o.s.n, 4);
    assert.strictEqual(o.b, false);

    assert.deepEqual(o, {n: 3, s: {n: 4, s: '', a: [4]}, b: false});
    assert.deepEqual(o.snapshot(), {n: 3, s: {n: 4, s: '', a: [4]}, b: false});
  });
});

'use strict';
var assert = require('assert');

var M = require('..');

describe('property containers', function () {
  it('allows primitive properties', function () {
    var o =
      M.Object({
        props: {
          n: M.Number({initialValue: 3}),
          s: M.Object({
            props: {
              n: M.Number({initialValue: 4}),
              s: M.String(),
              b: M.Boolean()
            }
          }),
          b: M.Boolean()
        }
      })
        .instantiate(undefined, [], {
          set: function (cb) {
            cb();
          }
        });

    assert.strictEqual(o.n, 3);
    assert.strictEqual(o.s.n, 4);
    assert.strictEqual(o.b, false);
  });

});

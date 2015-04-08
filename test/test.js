'use strict';
var assert = require('assert');

var MS = require('..');

describe('property containers', function () {
  it('allows primitive properties', function () {
    var o = MS.Object(null,
      {
      propSpecs: {
        n: {type: MS.Number},
        s: {type: MS.String},
        b: {type: MS.Boolean}
      }
    },
    [],
    {set: function (cb){cb();}}
    );

    assert.strictEqual(o.n, 0);
    assert.strictEqual(o.s, '');
    assert.strictEqual(o.b, false);
  });

});

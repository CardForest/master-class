'use strict';

var assert = require('assert');
var M = require('../..');

describe('mutator', function () {
  it('can receive parameter, read and change it\'s owner object', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        m1: M.Mutator(function(x) {
          this.n = this.n + x;
        }),
        m2: M.Mutator(function() {
          this.n = this.n - 2;
        })
      }
    }).createInstance();

    o.m1(3);
    assert.strictEqual(o.n, 3);

    o.m2();
    assert.strictEqual(o.n, 1);
  });
});

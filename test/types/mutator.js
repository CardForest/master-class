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

  it('can be guarded by a function', function () {
    var o = M({
      props: {
        n: M.Number({initialValue: 5}),
        isNLessThan10: M.Getter(function () {return this.n < 10;}),
        m: M.Mutator({
          guard: function () {return this.isNLessThan10;},
          fn: function(x){
            this.n = this.n + x;
          }
        })
      }
    }).createInstance();

    o.m(3);
    assert.strictEqual(o.n, 8);

    o.m(3);
    assert.strictEqual(o.n, 11);

    assert.throws(function () {
      o.m(3);
    });
  });

  it('guard cannot make changes', function () {
    var o = M({
      props: {
        n: M.Number({initialValue: 5}),
        m: M.Mutator({
          guard: function () {return this.n++;},
          fn: function(x){
            this.n = this.n + x;
          }
        })
      }
    }).createInstance();

    assert.throws(function () {
      o.m(3);
    });
  });
});

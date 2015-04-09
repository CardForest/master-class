'use strict';

var assert = require('assert');
var M = require('../..');

describe('array', function () {
  it('allows primitive elements', function () {
    var arr = M.Array({
      defaultLength: 4,
      elem: M.Number()
    }).createInstance();

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[2], 0);

    arr[2] = 3;

    assert.strictEqual(arr[2], 3);
  });

  it('allows object elements', function () {
    var arr = M.Array({
      defaultLength: 4,
      elem: M.Object({
        props: {
          n: M.Number(),
          s: M.String(),
          b: M.Boolean()
        }
      })
    }).createInstance();

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[0].n, 0);
    assert.strictEqual(arr[1].s, '');
    assert.strictEqual(arr[3].b, false);

    arr[2].n = 3;
    assert.strictEqual(arr[2].n, 3);
  });

  it('allows nested FixedArray', function () {
    var arr = M.Array({
      defaultLength: 4,
      elem: M.Array({
        defaultLength: 2,
        elem: M.Number()
      })
    }).createInstance();

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[2].length, 2);
    assert.strictEqual(arr[0][1], 0);

    arr[0][1] = 3;
    assert.strictEqual(arr[0][1], 3);
  });

  it('properties are frozen', function () {
    var arr = M.Array({
      defaultLength: 4,
      elem: M.Number()
    }).createInstance();

    assert.throws(function() {arr.s = 'should throw';});
    assert.throws(function() {delete arr[0];});
  });

  it('throws exception on assignment of incorrect primitive type', function () {
    var arr = M.Array({
      defaultLength: 4,
      elem: M.Number()
    }).createInstance();

    assert.throws(function() {arr[0] = 'should throw';});
  });
});

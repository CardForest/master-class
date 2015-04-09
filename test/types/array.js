'use strict';

var assert = require('assert');
var M = require('../..');

var noOpControl = {
  set: function (cb) {
    cb();
  }
};

describe.skip('array', function () {
  it('allows primitive elements', function () {
    var arr = M.Array({
      defaultLength: 4,
      elemSpec: M.Number()
    }).createInstance(null, [], noOpControl);;

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[0], 0);
    assert.strictEqual(arr[3], 0);
  });
/*
  it('allows object elements', function () {
    var arr = Master.newInstance({
      $type: Master.FixedArray,
      $length: 4,
      $elem: {
        n: Number,
        s: String,
        b: Boolean
      }
    });

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[0].n, 0);
    assert.strictEqual(arr[3].b, false);
  });

  it('allows nested FixedArray', function () {
    var arr = Master.newInstance( {
      $type: Master.FixedArray,
      $length: 4,
      $elem: {
        $type: Master.FixedArray,
        $length: 2,
        $elem: Number
      }
    });

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[2].length, 2);
    assert.strictEqual(arr[0][1], 0);
  });
});

describe('FixedArray - syntactic sugar', function () {
  it('allows primitive elements', function () {
    var arr = Master.newInstance([{
      $type: Number,
      $length: 4
    }]);

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[0], 0);
    assert.strictEqual(arr[3], 0);
  });

  it('allows object elements', function () {
    var arr = Master.newInstance([{
      $type: {
        n: Number,
        s: String,
        b: Boolean
      },
      $length: 4
    }]);

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[0].n, 0);
    assert.strictEqual(arr[3].b, false);
  });

  it('allows nested FixedArray', function () {
    var arr = Master.newInstance([{
      $type: [{
        $type: Number,
        $length: 2
      }],
      $length: 4
    }]);

    assert.strictEqual(arr.length, 4);
    assert.strictEqual(arr[2].length, 2);
    assert.strictEqual(arr[0][1], 0);
  });
});

describe('FixedArray - strictness', function () {
  it('throws exception on property add', function () {
    var arr = Master.newInstance([{$type: Number, $length: 4}]);

    assert.throws(function() {arr.s = 'should throw';});
  });

  it('throws exception on assignment of incorrect primitive type', function () {
    var arr = Master.newInstance([{$type: Number, $length: 4}]);

    assert.throws(function() {arr[0] = 'should throw';});
  });

  it('throws exception on property delete', function () {
    var arr = Master.newInstance([{$type: Number, $length: 4}]);

    assert.throws(function() {delete arr[0];});
  });

  it('throws exception on non primitive assignment', function () {
    var arr = Master.newInstance([{
      $type: {
        s: String
      },
      $length: 4
    }]);

    assert.throws(function() {arr[0] = {s: 'should fail'};});
  });
  */
});

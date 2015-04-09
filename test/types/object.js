'use strict';

var assert = require('assert');
var M = require('../..');

var noOpControl = {
  set: function (cb) {
    cb();
  }
};

describe('object', function () {
  it('allows primitive properties', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        s: M.String(),
        b: M.Boolean()
      }
    }).createInstance(null, [], noOpControl);

    assert.strictEqual(o.n, 0);
    assert.strictEqual(o.s, '');
    assert.strictEqual(o.b, false);

    o.n = 3;
    o.s = 'test';
    o.b = true;

    assert.strictEqual(o.n, 3);
    assert.strictEqual(o.s, 'test');
    assert.strictEqual(o.b, true);
  });


  it('allows nested objects', function () {
    var o = M.Object({
      props: {
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    }).createInstance(null, [], noOpControl);

    assert(o.hasOwnProperty('o'));
    assert.strictEqual(o.o.n, 0);

    o.o.n = 3;
    assert.strictEqual(o.o.n, 3);
  });

  it('properties are frozen', function () {
    var o = M.Object({
      props: {
        n: M.Number()
      }
    }).createInstance(null, [], noOpControl);

    assert.throws(function() {o.s = 'should throw';});
    assert.throws(function() {delete o.n;});
  });

  it('disallows assignment of nested objects', function () {
    var o = M.Object({
      props: {
        o: M.Object({
          props: {
            n: M.Number()
          }
        })
      }
    }).createInstance(null, [], noOpControl);

    assert.throws(function() {o.o = {n: 3};});
  });

  it('throws exception on assignment of incorrect primitive type', function () {
    var o = M.Object({
      props: {
        n: M.Number()
      }
    }).createInstance(null, [], noOpControl);

    assert.throws(function() {o.n = 'should throw';});
  });
});

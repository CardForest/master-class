'use strict';

var assert = require('assert');
var M = require('../..');

describe('object', function () {
  it('allows primitive properties', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        s: M.String(),
        b: M.Boolean()
      }
    }).createInstance();

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
    }).createInstance();

    assert(o.hasOwnProperty('o'));
    assert.strictEqual(o.o.n, 0);

    o.o.n = 3;
    assert.strictEqual(o.o.n, 3);
  });

  it('can be set from a value on instance creation', function () {
    var o = M.Object({
      props: {
        o: M.Object({
          props: {
            n: M.Number(),
            notSet: M.Number({initialValue: 2})
          }
        }),
        n: M.Number({initialValue: 5})
      }
    }).createInstance({o: {n: 3}, n: 4});

    assert.strictEqual(o.n, 4);
    assert.strictEqual(o.o.n, 3);
    assert.strictEqual(o.o.notSet, 2);
  });

  it('properties are frozen', function () {
    var o = M.Object({
      props: {
        n: M.Number()
      }
    }).createInstance();

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
    }).createInstance();

    assert.throws(function() {o.o = {n: 3};});
  });

  it('throws exception on assignment of incorrect primitive type', function () {
    var o = M.Object({
      props: {
        n: M.Number()
      }
    }).createInstance();

    assert.throws(function() {o.n = 'should throw';});
  });
});

'use strict';

var assert = require('assert');
var M = require('../..');

describe('sugar', function () {
  it('respects normal object syntax', function () {
    const o = M.Sugar({props: {n: M.Number()}}).createInstance();

    assert.strictEqual(o.n, 0);
  });

  it('converts object with no props field', function () {
    const o = M.Sugar({n: M.Number()}).createInstance();

    assert.strictEqual(o.n, 0);
  });

  it('converts array', function () {
    const o = M.Sugar([{n: M.Number()}]).createInstance();

    assert.strictEqual(o[0].n, 0);
  });

  it('converts from native primitive constructors', function () {
    const n = M.Sugar(Number).createInstance();
    const b = M.Sugar(Boolean).createInstance();
    const s = M.Sugar(String).createInstance();

    assert.strictEqual(n, 0);
    assert.strictEqual(b, false);
    assert.strictEqual(s, '');
  });

  it('converts from primitives', function () {
    const n = M.Sugar(1).createInstance();
    const b = M.Sugar(true).createInstance();
    const s = M.Sugar('test').createInstance();

    assert.strictEqual(n, 1);
    assert.strictEqual(b, true);
    assert.strictEqual(s, 'test');
  });

  it('passes keys that start with $ as object options', function () {
    const o = M.Sugar({
      $rootPropertyName: 'test',
      inner: {
        get it() {
          return this.test;
        }
      }
    }).createInstance();

    assert.strictEqual(o.inner.it, o);
  });

  it('traverse to object properties', function () {
    const o = M.Sugar({
      n: Number,
      o: {
        s: String('test'),
        a: [{b: true}]
      }
    }).createInstance();

    assert.strictEqual(o.n, 0);
    assert.strictEqual(o.o.s, 'test');
    assert.strictEqual(o.o.a[0].b, true);
  });

  it('converts getters', function () {
    const o = M.Sugar({
      n: 3,
      get g() {
        return this.n;
      }
    }).createInstance();

    o.n = 2;
    assert.strictEqual(o.g, 2);
  });

  it('converts mutators', function () {
    const o = M.Sugar({
      n: 3,
      m(x) {
        this.n += x;
      }
    }).createInstance();

    o.m(1);
    assert.strictEqual(o.n, 4);
  });
});

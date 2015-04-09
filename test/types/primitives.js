'use strict';

var assert = require('assert');

var M = require('../..');

describe('primitives', function () {
  it('have default values', function () {
    var n = M.Number().createInstance();
    assert.strictEqual(n, 0);

    var s = M.String().createInstance();
    assert.strictEqual(s, '');

    var b = M.Boolean().createInstance();
    assert.strictEqual(b, false);
  });

  it('accept initial values', function () {
    var n = M.Number({initialValue: 3}).createInstance();
    assert.strictEqual(n, 3);

    var s = M.String({initialValue: 'test'}).createInstance();
    assert.strictEqual(s, 'test');

    var b = M.Boolean({initialValue: true}).createInstance();
    assert.strictEqual(b, true);
  });

  it('can override value on instance creation', function () {
    var n = M.Number({initialValue: 3}).createInstance(4);
    assert.strictEqual(n, 4);

    var s = M.String({initialValue: 'test'}).createInstance('test2');
    assert.strictEqual(s, 'test2');

    var b = M.Boolean({initialValue: true}).createInstance(false);
    assert.strictEqual(b, false);
  });

  it('throws exception when setting the wrong type on initial value or instance creation', function () {
    assert.throws(function () {
      M.Number({initialValue: ''});
    });

    assert.throws(function () {
      M.String({initialValue: 3});
    });

    assert.throws(function () {
      M.Boolean({initialValue: 3});
    });

    assert.throws(function () {
      M.Number().createInstance('');
    });

    assert.throws(function () {
      M.String().createInstance(3);
    });

    assert.throws(function () {
      M.Boolean().createInstance(3);
    });
  });
});

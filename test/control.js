'use strict';

var assert = require('assert');
var M = require('..');

var sinon = require('sinon');

describe('control', function () {
  it('can disallow change', function () {
    var o =
      M({
        props: {
          n: M.Number({initialValue: 3}),
          o: M.Object({
            props: {
              n: M.Number({initialValue: 5})
            }
          })
        }
      }).createInstance(null, {isChangeAllowed: false});


    assert.throws(function() {o.n = 4;});
    assert.strictEqual(o.n, 3);

    assert.throws(function() {o.o.n = 6;});
    assert.strictEqual(o.o.n, 5);
  });

  it('listens to change events', function () {
    var changeListenerSpy = sinon.spy();

    var o =
      M({
        props: {
          n: M.Number({initialValue: 3}),
          o: M.Object({
            props: {
              n: M.Number({initialValue: 5})
            }
          })
        }
      }).createInstance(null, {onChange: changeListenerSpy});

    o.n = 4;
    o.o.n = 6;

    assert.strictEqual(changeListenerSpy.callCount, 2);
    assert.deepEqual(changeListenerSpy.firstCall.args, ['setValue', {newValue: 4, keyPath: [], key: 'n'}]);
    assert.deepEqual(changeListenerSpy.secondCall.args, ['setValue', {newValue: 6, keyPath: ['o'], key: 'n'}]);
  });
});

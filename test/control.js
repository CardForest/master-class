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
      }).createInstance();

    o.control.isChangeAllowed = false;


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
      }).createInstance();

    o.control.on('change', changeListenerSpy);

    o.n = 4;
    o.o.n = 6;

    assert.strictEqual(changeListenerSpy.callCount, 2);
    assert.deepEqual(changeListenerSpy.firstCall.args, ['setValue', {newValue: 4, trgKeyPath: [], key: 'n'}, {initialValue: 3}]);
    assert.deepEqual(changeListenerSpy.secondCall.args, ['setValue', {newValue: 6, trgKeyPath: ['o'], key: 'n'}, {initialValue: 5}]);
  });

  it('can override mutators', function () {
    var mutatorToWrap = function(x) {
      this.n = this.n + x;
    };

    var o = M({
      props: {
        n: M.Number(),
        m: M.Mutator(mutatorToWrap)
      }
    }).createInstance();

    o.control.onMutatorCall = sinon.spy(function (keyPath, args, mutator) {
      mutator.apply(this, args); // add 3 to n
      return this.n += args[0] + 4; // add another using the same argument as the original mutator and another 4
    });

    assert.strictEqual(o.m(3), 10);
    assert.strictEqual(o.n, 10);
    assert(o.control.onMutatorCall.calledOnce);
    assert.deepEqual(o.control.onMutatorCall.firstCall.args, [[ 'm' ], [ 3 ], mutatorToWrap]);
  });

  it('can override rootPropertyName', function () {
    var o = M({
      rootPropertyName: 'head',
      props: {
        n: M.Number({initialValue: 1}),
        o: M.Object({
          props: {
            n: M.Number({initialValue: 5})
          }
        })
      }
    }).createInstance();

    assert.strictEqual(o.o.head.n, 1);
  });
});

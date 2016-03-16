'use strict';

var assert = require('assert');
var M = require('../..');

describe('state', function () {
  it('passes through a single object', function () {
    var o = M({
      props: {
        state: M.State([
          {
            value: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, 3);
  });

  it('merges two objects', function () {
    var o = M({
      props: {
        state: M.State([
          {
            value: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            value: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, 3);
    assert.strictEqual(o.state.m, 1);
  });

  it('avoid merge on predicate', function () {
    var o = M({
      props: {
        flag: M.Boolean(),
        state: M.State([
          {
            when(root) {return root.flag;},
            value: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            when(root) {return !root.flag;},
            value: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    }).createInstance();

    assert.strictEqual(o.state.n, undefined);
    assert.strictEqual(o.state.m, 1);

    o.flag = true;

    assert.strictEqual(o.state.n, 3);
    assert.strictEqual(o.state.m, undefined);
  });

  it('supports snapshot round-trip', function () {
    var opt = {
      props: {
        state: M.State([
          {
            value: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            value: M.Object({
              props: {
                m: M.Number({initialValue: 1})
              }
            })
          }
        ])
      }
    };
    var o = M(opt).createInstance();
    var oCopy = M(opt).createInstance(o.snapshot());

    assert.deepEqual(oCopy, o);
  });
});

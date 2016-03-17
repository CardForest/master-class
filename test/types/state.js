'use strict';

var assert = require('assert');
var M = require('../..');

describe('state', function () {
  it('passes through a single object', function () {
    var o = M({
      props: {
        state: M.State([
          {
            delegate: M.Object({
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
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            delegate: M.Object({
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
            when() {
              return this.root.flag;
            },
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            when() {
              return !this.root.flag;
            },
            delegate: M.Object({
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
            delegate: M.Object({
              props: {
                n: M.Number({initialValue: 3})
              }
            })
          },
          {
            delegate: M.Object({
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

  describe('sub-state', function () {
    it('merges with parent', function () {
      var o = M({
        props: {
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, 5);
    });

    it('overrides parent state', function () {
      var o = M({
        props: {
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                delegate: M.Object({
                  props: {
                    n: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, 5);
    });

    it('respects predicate', function () {
      var o = M({
        props: {
          flag: M.Boolean(),
          state: M.State([
            {
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3})
                }
              }),
              subState: [{
                when() {
                  return this.root.flag;
                },
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.m, undefined);
      o.flag = true;
      assert.strictEqual(o.state.m, 5);
    });

    it('respects parent predicate', function () {
      var o = M({
        props: {
          flag: M.Boolean(),
          state: M.State([
            {
              when() {
                return this.root.flag;
              },
              delegate: M.Object({
                props: {
                  n: M.Number({initialValue: 3}),
                  flag2: M.Boolean()
                }
              }),
              subState: [{
                when() {
                  return this.flag2;
                },
                delegate: M.Object({
                  props: {
                    m: M.Number({initialValue: 5})
                  }
                })
              }]
            }
          ])
        }
      }).createInstance();

      assert.strictEqual(o.state.n, undefined);
      assert.strictEqual(o.state.m, undefined);
      o.flag = true;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, undefined);
      o.state.flag2 = true;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, 5);
      o.state.flag2 = false;
      assert.strictEqual(o.state.n, 3);
      assert.strictEqual(o.state.m, undefined);
    });

  });
});

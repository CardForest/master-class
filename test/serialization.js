const assert = require('assert');
const sinon = require('sinon');

const M = require('../i2');

describe('serialization', function() {
  it('is deep equal', () => {
    const m = Object.assign(new M(), {p: 1, o: {arr: [{p: 1}]}});
    const x = m.serialize();
    const mTarget = M.deserialize(x);

    assert.deepEqual(mTarget, m);
  });

  it('preserves references', () => {
    const o = {};
    const m = Object.assign(new M(), {o1: o, o2: o});
    const mTarget = M.deserialize(m.serialize());

    assert.strictEqual(mTarget.o1, mTarget.o2);
  });

  it('preserves reference loop', () => {
    const m = new M();
    m.m = m;
    const mTarget = M.deserialize(m.serialize());

    assert.strictEqual(mTarget.m, mTarget);
  });

  it('preserves prototypes', () => {
    class C1 extends M {}
    class C2 {}
    const c1 = Object.assign(new C1(), {c2: new C2()});
    const c1Target = M.deserialize(c1.serialize(), {classes: {C1, C2}});

    assert.strictEqual(Reflect.getPrototypeOf(c1Target), C1.prototype);
    assert.strictEqual(Reflect.getPrototypeOf(c1Target.c2), C2.prototype);
  });

  it('can attach a new context', () => {
    const m = new M();
    const context = {};
    const mTarget = M.deserialize(m.serialize(), {context});

    assert.strictEqual(mTarget.$context, context);
  });

  it('respects inner clone method', () => {
    const m = Object.assign(new M(), {
      o: {
        clone() {
          return {n: 3};
        }
      }
    });

    assert.deepEqual(M.deserialize(m.serialize()).o.n, 3);
  });

  it('removes a property when it\'s value clone method returns undefined', () => {
    const m = Object.assign(new M(), {
      o: {
        clone() {}
      }
    });

    assert(!M.deserialize(m.serialize()).hasOwnProperty('o'));
  });

  it('inner clone method receives initial call first parameter', () => {
    const o = {
      clone() {}
    };

    const serializeSpy = sinon.spy(o, 'clone');

    Object.assign(new M(), {o}).serialize(1);

    assert.strictEqual(serializeSpy.callCount, 1);
    assert(serializeSpy.firstCall.calledWithExactly(1));
  });
});

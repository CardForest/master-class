const assert = require('assert');
const sinon = require('sinon');

const skeleton = require('../lib/skeleton');

describe('skeleton', function() {
  it('dispatch action event on property set', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = skeleton(original, {dispatch});
    original.x = 3;
    assert(!dispatch.called);
    proxy.y = 3;
    assert(dispatch.calledOnce);
    sinon.assert.calledWithExactly(dispatch,
      'action',
      {
        targetKeyPath: [],
        actionType: 'set',
        args: [{propertyKey: "y", value: 3}]
      }
    );
  });

  it('dispatch action event on property delete', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = skeleton(original, {dispatch});
    delete original.x;
    assert(!dispatch.called);
    delete proxy.y;
    assert(dispatch.calledOnce);
    sinon.assert.calledWithExactly(dispatch,
      'action',
      {
        targetKeyPath: [],
        actionType: 'deleteProperty',
        args: [{propertyKey: "y"}]
      }
    );
  });

  it('dispatch action event on nested property set', () => {
    const dispatch = sinon.spy();
    const proxy = skeleton({}, {dispatch});
    proxy.o = {};
    proxy.o.x = 3;
    assert(dispatch.calledTwice);
    sinon.assert.calledWithExactly(dispatch.getCall(1),
      'action',
      {
        targetKeyPath: ['o'],
        actionType: 'set',
        args: [{propertyKey: "x", value: 3}]
      }
    );
  });

  it('dispatch action event on nested property delete', () => {
    const dispatch = sinon.spy();
    const proxy = skeleton({}, {dispatch});
    proxy.o = {};
    delete proxy.o.x;
    assert(dispatch.calledTwice);
    sinon.assert.calledWithExactly(dispatch.getCall(1),
      'action',
      {
        targetKeyPath: ['o'],
        actionType: 'deleteProperty',
        args: [{propertyKey: "x"}]
      }
    );
  });

  it('does not effect prototype', () => {
    class C {}
    const c = new C();
    const proxy = skeleton(c);

    assert(proxy instanceof C);
  });

  it('maintains $parent ref', () => {
    const child = {};
    const grandchild = {};
    const proxy = skeleton();
    proxy.child = child;
    proxy.child.grandchild = grandchild;

    assert.strictEqual(proxy.child.$parent, proxy);
    assert.strictEqual(proxy.child.grandchild.$parent, proxy.child);
  });

  describe('revocation', () => {
    it('revokes on root call to $revoke', () => {
      const proxy = skeleton();
      proxy.x = 1;
      proxy.$revoke();
      assert.throws(() => {proxy.x;}); //jshint ignore:line
    });

    it('revokes on delete from first path', () => {
        const proxy = skeleton();
        proxy.c = proxy.b = proxy.a = {x: 1};
        delete proxy.c;
        assert.doesNotThrow(() => {proxy.b.x;}); //jshint ignore:line
        delete proxy.a;
        assert.throws(() => {proxy.b.x;}); //jshint ignore:line
    });

    it('revokes on re-assigning to first path', () => {
      const proxy = skeleton();
      const a = {x: 1};
      proxy.b = proxy.a = a;
      proxy.a = a;
      assert.doesNotThrow(() => {proxy.b.x;}); //jshint ignore:line
      proxy.a = proxy.a;
      assert.doesNotThrow(() => {proxy.b.x;}); //jshint ignore:line
      proxy.a = {x: 2};
      assert.strictEqual(proxy.a.x, 2);
      assert.throws(() => {proxy.b.x;}); //jshint ignore:line
    });
  });

});

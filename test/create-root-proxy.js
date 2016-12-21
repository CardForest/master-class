const assert = require('assert');
const sinon = require('sinon');

const createRootProxy = require('../lib/create-root-proxy');

describe('createRootProxy', function() {
  it('dispatch action event on property set', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = createRootProxy(original, {dispatch});
    original.x = 3;
    assert(!dispatch.called);
    proxy.y = 3;
    assert(dispatch.calledOnce);
    sinon.assert.calledWithExactly(dispatch,
      'action',
      {
        targetKeyPath: [],
        actionType: 'set',
        payload: {propertyKey: "y", value: 3}
      }
    );
  });

  it('dispatch action event on property delete', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = createRootProxy(original, {dispatch});
    delete original.x;
    assert(!dispatch.called);
    delete proxy.y;
    assert(dispatch.calledOnce);
    sinon.assert.calledWithExactly(dispatch,
      'action',
      {
        targetKeyPath: [],
        actionType: 'deleteProperty',
        payload: {propertyKey: "y"}
      }
    );
  });

  it('dispatch action event on nested property set', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = createRootProxy(original, {dispatch});
    proxy.o = {};
    proxy.o.x = 3;
    assert(dispatch.calledTwice);
    sinon.assert.calledWithExactly(dispatch.getCall(1),
      'action',
      {
        targetKeyPath: ['o'],
        actionType: 'set',
        payload: {propertyKey: "x", value: 3}
      }
    );
  });

  it('dispatch action event on nested property delete', () => {
    const original = {};
    const dispatch = sinon.spy();
    const proxy = createRootProxy(original, {dispatch});
    proxy.o = {};
    delete proxy.o.x;
    assert(dispatch.calledTwice);
    sinon.assert.calledWithExactly(dispatch.getCall(1),
      'action',
      {
        targetKeyPath: ['o'],
        actionType: 'deleteProperty',
        payload: {propertyKey: "x"}
      }
    );
  });
});

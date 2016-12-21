const assert = require('assert');
const sinon = require('sinon');

const defineActions = require('../i3');

describe('defineActions', function() {
  it('attaches a methods to class prototype', () => {
    class C {}
    defineActions(C, {m1() {}, m2() {}});

    assert(C.prototype.hasOwnProperty('m1'));
    assert(C.prototype.hasOwnProperty('m2'));
    assert(C.prototype.m1 instanceof Function);
  });

  it('it run the action normally when this.$context.isProxy is false', () => {
    class C {}
    const m = sinon.spy();
    defineActions(C, {m});
    const c = new C();
    c.$context = {isProxy: false};

    c.m(1, 2, 3);

    assert(m.calledOnce);
    assert(m.calledWithExactly(1, 2, 3));
  });

  it('it doesn\'t call action when this.$context.isProxy is true', () => {
    class C {}
    const m = sinon.spy();
    defineActions(C, {m});
    const c = new C();
    c.$context = {isProxy: true, dispatcher: {dispatch() {}}};

    c.m(1, 2, 3);

    assert(!m.called);
  });

  it('it calls this.$context.dispatcher.dispatch when this.$context.isProxy is true', () => {
    class C {}
    defineActions(C, {m() {}});
    const dispatch = sinon.spy();
    const c = new C();
    c.$context = {isProxy: true, dispatcher: {dispatch}};
    c.$keyPath = {};

    c.m(1, 2, 3);

    assert(dispatch.called);
    assert(dispatch.calledWithExactly('action', {keyPath: c.$keyPath, actionId: 'm', args: [1, 2, 3]}));
  });
});

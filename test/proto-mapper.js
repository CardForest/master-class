'use strict';

const assert = require('assert');
const ProtoMapper = require('../lib/proto-mapper');
const {
  declareRemotableActions,
  RemotableMaker
} = require('../lib/remotable');

const sinon = require('sinon');

describe('ProtoMapper', function () {
  class A {
    x() {
      return 'x';
    }
  }

  class B extends A {
    y() {
      return 'y';
    }

    z() {
      return 'z';
    }
  }

  Reflect.defineMetadata('test-label', undefined, A.prototype, 'x');
  Reflect.defineMetadata('test-label', undefined, B.prototype, 'z');
  Reflect.defineMetadata('test-label2', undefined, B.prototype, 'z');

  it('should override where label is found', function () {
    const protoMapper = new ProtoMapper({
      'test-label': (originalMethod) => () => 'override ' + originalMethod(),
      'test-label2': (originalMethod) => () => 'override2 ' + originalMethod()
    });
    const b = new B();
    assert.strictEqual(b.x(), 'x');
    assert.strictEqual(b.y(), 'y');
    assert.strictEqual(b.z(), 'z');

    Object.setPrototypeOf(b, protoMapper.map(B.prototype));

    assert.strictEqual(b.x(), 'override x');
    assert.strictEqual(b.y(), 'y');
    assert.strictEqual(b.z(), 'override2 override z');
  });

  it('facilitates the remotable use-case', () => {
    // const protoMapper = new ProtoMapper({
    //   'action': (_, actionType) => function(...args) {
    //     return this.$context.dispatcher.dispatch('action', {
    //       targetKeyPath: this.$keyPath,
    //       actionType,
    //       args
    //     });
    //   }
    // });
    //
    // class G {
    //   static proxy(...constructorArgs) {
    //     if (!this._proxyProto) {
    //       this.actions.forEach((actionKey) => {
    //         Reflect.defineMetadata('action', undefined, this.prototype, actionKey);
    //       });
    //       this._proxyProto = protoMapper.map(this.prototype);
    //     }
    //
    //     const proxy = new this(...constructorArgs);
    //     Object.setPrototypeOf(proxy, this._proxyProto);
    //     return proxy;
    //   }
    // }
    //
    // class C extends G {
    //   m() {}
    //   static get actions() {return ['m'];}
    // }
    //
    // const c = C.proxy();


    class C {m() {}}

    declareRemotableActions(C, 'm');

    const dispatch = sinon.spy();
    const remotableMaker = new RemotableMaker({dispatch});

    const c = new C();
    Object.setPrototypeOf(c, remotableMaker.make(C.prototype));
    c.$keyPath = {};

    c.m(1, 2, 3);

    assert(dispatch.calledOnce);
    assert(dispatch.calledWithExactly('action', {targetKeyPath: c.$keyPath, actionType: 'm', args: [1, 2, 3]}));
  });
});

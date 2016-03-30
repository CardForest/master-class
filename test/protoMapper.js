'use strict';

const assert = require('assert');
const ProtoMapper = require('../lib/utils/protoMapper');

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
});

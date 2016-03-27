'use strict';

const forOwn = require('lodash.forown');

class MObject {
  constructor(value) {
    Object.defineProperty(this, '$keyPath', {value: [], writable: true});
    Object.defineProperty(this, '$root', {value: this, writable: true});
    Object.defineProperty(this, '$context', {value: {isChangeAllowed: true}, writable: true});

    if (value == null) {
      value = {};
    }

    forOwn(this.constructor.opt.props, (Class, key) => {
      if ('createInstance' in Class) {
        this[key] = Class.createInstance(value[key]);
      }
    });

    this.$onInit();

    Object.seal(this);
  }

  $onInit() {}

  $snapshot() {
    return this.constructor.snapshot(this);
  }

  static snapshot(instance) {
    const res = {};
    forOwn(this.opt.props, (Class, key) => {
      if ('snapshot' in Class) {
        res[key] = Class.snapshot(instance[key]);
      }
    });

    return res;
  }

  static createInstance(value) {
    return new this(value);
  }

  static toPropertyDescriptor(key) {
    const self = this;
    const keySymbol = Symbol(`_${key}`);

    return {
      enumerable: true,
      configurable: false,
      set(value) {
        if (! (value instanceof self)) {
          value = self.createInstance(value);
        }
        value.$keyPath = this.$keyPath.concat(key);
        value.$context = this.$context;
        value.$root = this.$root;
        this[keySymbol] = value;
      },
      get() {
        return this[keySymbol];
      },
    };
  }
}
Object.freeze(MObject);
Object.freeze(MObject.prototype);

module.exports = MObject;

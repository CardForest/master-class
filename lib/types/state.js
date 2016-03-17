'use strict';

var propContainerUtil = require('./propContainerUtil');
var Control = require('../control');
var forOwn = require('lodash.forown');
var snapshotUtil = require('./snapshotUtil');

class WrappedMerge extends propContainerUtil.PropertyContainerFactory {
  constructor(objFactoryOpts) {
    super();

    if (!Array.isArray(objFactoryOpts)) {
      throw TypeError('expected objects array');
    }

    this.objFactoryOpts = objFactoryOpts;
  }

  createInstance(value, keyPath, control, parent) {
    if (keyPath == null) {
      keyPath = [];
    }
    if (control == null) {
      control = new Control();
    }

    if (value != null && typeof value !== 'object') {
      // support overriding of object with new types from mappers
      return value;
    }

    var allDelegates = this.objFactoryOpts.map((factory, idx) => {
      return {
        idx,
        obj: factory.value.createInstance(value && value[idx], keyPath, control, this)
      };
    });

    let delegates = this.delegates = [];

    const updateDelegates = () => {
      delegates = this.delegates = allDelegates.filter((delegate, idx) => {
        const factoryOpts = this.objFactoryOpts[idx];
        return !factoryOpts.when || factoryOpts.when(parent[control.rootPropertyName]);
      });
    };

    control.on('instance created', updateDelegates);
    control.on('change', updateDelegates);


    //var root = (parent == null) ? this : (parent.hasOwnProperty(control.rootPropertyName) ? parent[control.rootPropertyName] : parent);
    //
    //Object.defineProperty(
    //  this,
    //  control.rootPropertyName,
    //  {
    //    enumerable: false,
    //    configurable: false,
    //    value: root,
    //    writable: false
    //  }
    //);
    //
    //Object.defineProperty(
    //  this,
    //  'keyPath',
    //  {
    //    enumerable: false,
    //    configurable: false,
    //    value: keyPath,
    //    writable: false
    //  }
    //);

    // TODO user proxies here when they become more prolific
    return this.objFactoryOpts.reduce((wrapped, factoryOpts) => {
      const props = factoryOpts.value.opt.props;
      forOwn(props, (value, key) => {
        Object.defineProperty(wrapped, key, {
          enumerable: true,
          get() {
            for(var i = 0; i < delegates.length; i++) {
              if (delegates[i].obj.hasOwnProperty(key)) {
                return delegates[i].obj[key];
              }
            }
          }
        });
      });
      return wrapped;
    }, {get delegates() {return delegates;}});
  }

  snapshot(mapper, instance, keyPath) {
    var res = {};
    for (var i = 0, length = instance.delegates.length; i < length; i++) {
      const delegate = instance.delegates[i];
      res[delegate.idx] = snapshotUtil.overridableSnapshot(this.objFactoryOpts[delegate.idx].value, mapper, delegate.obj, keyPath);
    }

    return res;
  }
}

module.exports = function (objFactoryOpts) {
  return new WrappedMerge(objFactoryOpts);
};

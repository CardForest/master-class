'use strict';

const MObject = require('../classes/mObject');
const forOwn = require('lodash.forown');

module.exports = function mObjectFactory(opt) {
  if (!opt.hasOwnProperty('props')) {
    throw Error('object options must include \'props\'');
  }

  const MyMObject = class extends MObject {
    constructor(value) {
      super(value);
    }
  };

  Object.defineProperty(MyMObject, 'opt', {value: opt});

  forOwn(opt.props, (Class, optPropKey) => {
    if ('toPrototypePropertyDescriptors' in Class) {
      forOwn(Class.toPrototypePropertyDescriptors(optPropKey), (propDesc, key) => {
        Object.defineProperty(
          MyMObject.prototype,
          key,
          propDesc
        );
      });
    } else {
      Object.defineProperty(
        MyMObject.prototype,
        optPropKey,
        Class.toPropertyDescriptor(optPropKey)
      );
    }
  });
  Object.freeze(MyMObject);
  Object.freeze(MyMObject.prototype);

  return MyMObject;
};

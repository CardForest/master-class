'use strict';

require('reflect-metadata');

module.exports = class ProtoMapper {
  constructor(mappers) {
    this.cache = new WeakMap();
    this.cache.set(Object.prototype, false);

    this.mappers = mappers;
  }

  map(lowestProto) {
    const protoChain = [];

    let highestProto = lowestProto;
    while (!this.cache.has(highestProto)) {
      protoChain.push(highestProto);
      highestProto = Object.getPrototypeOf(highestProto);
    }
    // protoChain contains all the proto that do require mapping

    // highestProto is now the highest proto that was previously seen
    // highestMappedProto is a cloned&mapped version of that proto or false if no mapping was required
    let highestMappedProto = this.cache.get(highestProto);

    while (protoChain.length !== 0) {
      const nextHighestProto = protoChain.pop();
      const props = Object.getOwnPropertyNames(nextHighestProto);
      const propsToMap = props
        .map((_) => { // jshint ignore:line
          return {
            propName: _,
            metadataKeys: Reflect.getOwnMetadataKeys(nextHighestProto, _)
                          .filter((_) => this.mappers.hasOwnProperty(_))
          };
        })
        .filter((_) => _.metadataKeys.length !== 0);

      if (!highestMappedProto && propsToMap.length === 0) {
        // we never actually needed to map any prototype
        // and we don't need to map this prototype either
        this.cache.set(nextHighestProto, false);
        highestProto = nextHighestProto;
        continue;
      }

      // we need to map this prototype
      const nextHighestMappedProto = Object.create(highestMappedProto || highestProto);
      // first copy all previous properties
      props.forEach((_) => { // jshint ignore:line
        Object.defineProperty(nextHighestMappedProto, _, Object.getOwnPropertyDescriptor(nextHighestProto, _));
      });
      // next override from mappers
      propsToMap
        .forEach((_) => { // jshint ignore:line
          const propName = _.propName;
          let trgProp = nextHighestMappedProto[propName];
          _.metadataKeys.forEach((metadataKey) => {
            trgProp = nextHighestMappedProto[propName] = this.mappers[metadataKey](trgProp, propName);
          });
        });
      this.cache.set(nextHighestProto, nextHighestMappedProto);

      highestMappedProto = nextHighestMappedProto;
      highestProto = nextHighestProto; // (we don't really need this- but keeping this for coherence)
    }

    return highestMappedProto || highestProto;
  }
};

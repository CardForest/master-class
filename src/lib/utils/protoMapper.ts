import 'reflect-metadata';

class ProtoMapper {
  private cache = new WeakMap<object, object | false>([[Object.prototype, false]]);
  private mappers: Record<string, (value: unknown) => unknown>;

  constructor(mappers: Record<string, (value: unknown) => unknown>) {
    this.mappers = mappers;
  }

  map(lowestProto: object): object {
    const protoChain: object[] = [];
    let highestProto = lowestProto;
    while (!this.cache.has(highestProto)) {
      protoChain.push(highestProto);
      highestProto = Object.getPrototypeOf(highestProto) as object;
    }
    let highestMappedProto = this.cache.get(highestProto);

    while (protoChain.length !== 0) {
      const nextHighestProto = protoChain.pop()!;
      const props = Object.getOwnPropertyNames(nextHighestProto);
      const propsToMap = props
        .map((propName) => ({
          propName,
          metadataKeys: (Reflect.getOwnMetadataKeys(nextHighestProto, propName) as unknown[])
            .filter((key): key is string => typeof key === 'string' && Object.hasOwn(this.mappers, key))
        }))
        .filter((prop) => prop.metadataKeys.length !== 0);

      if (!highestMappedProto && propsToMap.length === 0) {
        this.cache.set(nextHighestProto, false);
        highestProto = nextHighestProto;
        continue;
      }

      const nextHighestMappedProto = Object.create(highestMappedProto || highestProto) as Record<string, unknown>;
      props.forEach((propName) => {
        Object.defineProperty(nextHighestMappedProto, propName, Object.getOwnPropertyDescriptor(nextHighestProto, propName)!);
      });
      propsToMap.forEach(({ propName, metadataKeys }) => {
        let trgProp = nextHighestMappedProto[propName];
        metadataKeys.forEach((metadataKey) => {
          trgProp = nextHighestMappedProto[propName] = this.mappers[metadataKey]!(trgProp);
        });
      });
      this.cache.set(nextHighestProto, nextHighestMappedProto);
      highestMappedProto = nextHighestMappedProto;
      highestProto = nextHighestProto;
    }

    return highestMappedProto || highestProto;
  }
}

export = ProtoMapper;

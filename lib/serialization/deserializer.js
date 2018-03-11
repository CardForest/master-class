module.exports = class Deserializer {
  static get defaultClasses() {return {Array, Object};}

  constructor(opt = {}) {
    this.classes = opt.hasOwnProperty('classes') ?
        Object.assign(opt.classes, Deserializer.defaultClasses)
      : Deserializer.defaultClasses;
  }

  deserialize(serialized) {
    const objects = JSON.parse(serialized).map((object) => {
      if (object.hasOwnProperty('$$classId')) {
        const constructor = this.classes[object.$$classId];
        if (constructor == null) {
          throw Error(`constructor<${object.$$classId}> was not found in registry`);
        }
        delete object.$$classId;
        return ('construct' in constructor) ?
          constructor.construct(object) :
          Object.assign(Reflect.construct(constructor, []), object);
      } else {
        return object;
      }
    });

    objects.forEach((object) => {
      console.log('object.$$raw')
      console.log(object)
      console.log(object.$$raw)
      Object.entries(('$$raw' in object) ? object.$$raw : object).forEach(([key, value]) => {
        if (value instanceof Object && value.hasOwnProperty('$$ref')) {
          console.log(object.$$raw)
          object[key] = objects[value.$$ref];
        }
      });
    });

    return  objects[0];
  }
};

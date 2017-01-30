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
        delete object.$$classId;
        return ('construct' in constructor) ?
          constructor.construct(object) :
          Object.assign(Reflect.construct(constructor, []), object);
      } else {
        return object;
      }
    });

    objects.forEach((object) => {
      Object.entries(('$$raw' in object) ? object.$$raw : object).forEach(([key, value]) => {
        if (value instanceof Object && value.hasOwnProperty('$$ref')) {
          object[key] = objects[value.$$ref];
        }
      });
    });

    return  objects[0];
  }
};

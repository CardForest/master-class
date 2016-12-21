module.exports = class Deserializer {
  static get defaultClasses() {return {Array, Object};}

  constructor(opt = {}) {
    this.classes = opt.hasOwnProperty('classes')
      ? Object.assign(opt.classes, Deserializer.defaultClasses)
      : Deserializer.defaultClasses;
  }

  deserialize(serialized) {
    const objects = JSON.parse(serialized).map((object) => {
      if (object.hasOwnProperty('$$classId')) {
        object = Object.assign(Reflect.construct(this.classes[object.$$classId], []), object);
        delete object.$$classId;
      }

      return object;
    });

    objects.forEach((object) => {
      Object.entries(object).forEach(([key, value]) => {
        if (value instanceof Object && value.hasOwnProperty('$$ref')) {
          object[key] = objects[value.$$ref];
        }
      });
    });

    return  objects[0];
  }
};

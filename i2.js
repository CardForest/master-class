class M {
  constructor() {
    this.$$id = 0;
    this.$$classId = this.constructor.name;
  }

  serialize(...opt) {
    const objects = [this];
    let nextId = 1;

    const objectsToSerialize = [this];
    while (objectsToSerialize.length != 0) {
      const clone = Object.assign({}, objectsToSerialize.shift());
      Object
        .entries(clone)
        .forEach(([key, value]) => {
          if (value instanceof Object) {

              if (!value.hasOwnProperty('$$classId')) {
                const prototype = Reflect.getPrototypeOf(value);
                if (prototype !== Object.prototype) {
                  value.$$classId = prototype.constructor.name;
                }
              }

              if (!value.hasOwnProperty('$$id')) {
                if ('serialize' in value) {
                  value = value.serialize(...opt)
                  if (value === undefined) {
                    delete clone[key]
                    return;
                  }
                  if (!(value instanceof Object)) {
                    throw Error('expected serialize to return an object');
                  }
                }

                const id = nextId++;
                objects[id] = value;
                value.$$id = id;
                if (!('serialize' in value)) {
                  objectsToSerialize.push(value);
                }
              }

              clone[key] = {$$ref: value.$$id};


          } else {

            clone[key] = value;
          }
      });

      objects[clone.$$id] = clone;
    }
    return JSON.stringify(objects);
  }

  static deserialize(serialized, opt = {}) {
    const classes = opt.hasOwnProperty('classes') ? Object.assign(opt.classes, {M, Array}) : {M, Array};

    const objects = JSON.parse(serialized).map((object) =>
        object.hasOwnProperty('$$classId') ? Object.assign(new (classes[object.$$classId])(), object) : object
    );

    objects.forEach((object) => {
      Object.entries(object).forEach(([key, value]) => {
        if (value instanceof Object && value.hasOwnProperty('$$ref')) {
          object[key] = objects[value.$$ref];
        }
      });
    });

    const object = objects[0];
    if (opt.hasOwnProperty('context')) {
      Reflect.defineProperty(object, '$context', {value: opt.context});
    }
    return object;
  }
}

M.Deserializer = class Deserializer {
  constructor(opt) {
    return (serialized) => {
      return M.deserialize(serialized, opt);
    }
  }
};

module.exports = M;

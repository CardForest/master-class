module.exports = class Serializer {
  _processObject(object) {
    if (!object.hasOwnProperty('$$cloneIdx')) {
      // this is the first time we encounter this object

      // save for cleaning
      this.objectsToClean.push(object);

      const customCloning = 'clone' in object;
      const clone = customCloning ?
        object.clone(this.opt)
        : Object.assign({}, object);

      if (clone === undefined) {
        // its clone returned undefined so we mark this on the original
        object.$$cloneIdx = undefined;
      } else if (clone instanceof Object) {
        // we have an actual object to store

        // store the constructor name
        clone.$$classId = Reflect.getPrototypeOf(customCloning ? clone : object).constructor.name;

        // save the cloned object and mark the id on the object
        object.$$cloneIdx = this.clones.push(clone) - 1;
      } else {
        throw Error('expected clone to return an object');
      }
    }
  }

  serialize(object, opt) {
    this.opt = opt;
    this.clones = [];
    this.objectsToClean = [];

    this._processObject(object);

    for (let i = 0; i < this.clones.length; i++) {
      const clone = this.clones[i];

      Object
        .entries(clone)
        .forEach(([key, value]) => {
          if (value instanceof Object) {
            this._processObject(value);
            if (value.$$cloneIdx === undefined) { // check if the value is marked for deletion
              delete clone[key];
            } else {
              clone[key] = {$$ref: value.$$cloneIdx};
            }
          }
        });
    }

    // cleanup
    this.objectsToClean.forEach((_) => {
      delete _.$$cloneIdx;
    });

    return JSON.stringify(this.clones);
  }
};

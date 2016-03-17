'use strict';

const EventEmitter = require('events');

class Control extends EventEmitter {
  constructor() {
    super();

    this.isChangeAllowed = true;
    this.rootPropertyName = 'root';
  }

  onMutatorCall(keyPath, args, mutator) {
    return mutator.apply(this, args);
  }
}


module.exports = Control;

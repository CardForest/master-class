'use strict';

const EventEmitter = require('events');

class Control extends EventEmitter {
  constructor() {
    super();

    this.isChangeAllowed = true;
    this.rootPropertyName = 'root';
  }
  onChange() {}
}


module.exports = {
  default: new Control()
};

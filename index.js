'use strict';

var primitives = require('./lib/types/primitives');
module.exports = {
  Object: require('./lib/types/object'),
  Array: require('./lib/types/array'),
  Number: primitives.Number,
  String: primitives.String,
  Boolean: primitives.Boolean
};

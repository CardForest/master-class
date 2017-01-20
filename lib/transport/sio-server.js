const sioFactory = require('socket.io');
const bluebird = require('bluebird');

function asPromised(fn) {
  const promiseWrappedHandler = bluebird.method(fn);
  return function(msg, cb) {
    return promiseWrappedHandler.call(this, msg).then((result) => {
      cb(result);
    });
  };
}

module.exports = class SioServer {
  constructor(httpServer) {
    this.handlers = [];

    this.sio = sioFactory(httpServer)
      .on('connection', (socket) => {
        this.handlers.forEach(function(handler) {
          socket.on(handler.id, handler.fn);
        });
      });
  }

  on(msgTypeId, handler) {
    this.handlers.push({
      id: msgTypeId,
      fn: asPromised(handler)
    });
  }

  dispatch(msgTypeId, payload) {
    this.sio.emit(msgTypeId, payload);
  }
};

const sioClientFactory = require('socket.io-client');

module.exports = class SioClient {
  constructor(uri) {
    this.clientSocket = sioClientFactory(uri);
  }

  dispatch(msgTypeId, payload) {
    return new Promise((resolve) => {this.clientSocket.emit(msgTypeId, payload, resolve);});
  }

  connect() {
    return new Promise((resolve) => {
      this.clientSocket.on('connect', resolve);
    });
  }

  on(msgTypeId, handler) {
    this.clientSocket.on(msgTypeId, handler);
  }
};

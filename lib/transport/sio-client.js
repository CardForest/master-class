const sioClientFactory = require('socket.io-client');

module.exports = class SioClient {
  constructor(uri) {
    this.clientSocket = sioClientFactory(uri);
  }

  dispatch(msgTypeId, payload) {
    return new Promise((resolve) => {this.clientSocket.emit(msgTypeId, payload, resolve);});
  }
};

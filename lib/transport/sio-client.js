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
      this.clientSocket.on('connect', () => {
        this.clientSocket.on('action', function({targetKeyPath, actionType, args}) {
          console.log(targetKeyPath);
          console.log(actionType);
          console.log(args);
        });
        resolve();
      });
    });
  }
};

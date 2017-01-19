const ProtoMapper = require('./proto-mapper');

function declareRemotableActions(Cls, ...actionKeys) {
  actionKeys.forEach((actionKey) => {
    Reflect.defineMetadata('remotable-action', undefined, Cls.prototype, actionKey);
  });
}

class RemotableActionsDispatchProtoMapper extends ProtoMapper {
  constructor({dispatch}) {
    super({
      'remotable-action': (_, actionType) => function(...args) {
        return dispatch('action', {
          targetKeyPath: this.$keyPath,
          actionType,
          args
        });
      }
    });
  }
}

// const KeyPath = require('key-path');
//
// function attachIncomingDispatcher(incomingChannel, target) {
//   incomingChannel.on('remotable-action', async function ({targetKeyPath, actionType, args}) {
//     const targetValue = KeyPath.get(targetKeyPath).getValueFrom(target);
//     if (!(targetValue[actionType] instanceof Function)) {
//       throw Error(`no '${actionType}' found in ${JSON.stringify(targetKeyPath)}`);
//     }
//
//     target.$context.requester = this;
//     const response = await targetValue[actionType](...args);
//     delete target.$context.requester;
//     return response;
//   });
// }

module.exports = {
  declareRemotableActions,
  RemotableActionsDispatchProtoMapper//,
  // attachIncomingDispatcher
};


// const httpServer = require('http').createServer();
//
// const sioServer = new (require('./transport/sio-server'))(httpServer);
//
// const target = {
//   $context: {},
//   x: {
//     async test(...args) {
//       return await 'server got ' + args + ' from ' + this.$context.requester.id;
//     }
//   }
// };
// target.x.$context = target.$context;
//
// attachIncomingDispatcher(sioServer, target);
//
// const sioClientFactory = require('socket.io-client');
//
// (async function () {
//   const port = await new Promise((resolve) => {
//     httpServer.listen(function () {resolve(this.address().port)});
//   });
//
//   const clientSocket = sioClientFactory(`http://localhost:${port}`);
//   clientSocket.emit('remotable-action', {targetKeyPath: ['x'], actionType: 'test', args: [1,2]}, function(response) {
//     console.log('client got back from server: \'' + response + '\'')
//   });
// })();

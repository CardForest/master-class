const KeyPath = require('key-path');

function attachIncomingDispatcher(incomingChannel, target) {
  incomingChannel.on('action', async function ({targetKeyPath, actionType, args}) {
    const targetValue = KeyPath.get(targetKeyPath).getValueFrom(target);
    if (!(targetValue[actionType] instanceof Function)) {
      throw Error(`no '${actionType}' found in ${JSON.stringify(targetKeyPath)}`);
    }

    target.$context.requester = this;
    const response = await targetValue[actionType](...args);
    delete target.$context.requester;
    return response;
  });
}

const {RemotableActionsDispatchProtoMapper, declareRemotableActions} = require('./remotable');

const httpServer = require('http').createServer();

const sioServer = new (require('./transport/sio-server'))(httpServer);

class Target {
  constructor() {
    this.$context = {};
    this.$keyPath = [];
  }
}
class Child {
  constructor(key, parent) {
    this.$context = parent.$context;
    this.$keyPath = parent.$keyPath.concat(key);

  }
  async test(...args) {
    return await 'server got ' + args + ' from ' + this.$context.requester.id;
  }
}
declareRemotableActions(Child, 'test');

const target = new Target();
target.child = new Child('child', target);


attachIncomingDispatcher(sioServer, target);


const sioClientFactory = require('socket.io-client');

(async function () {
  const port = await new Promise((resolve) => {
    httpServer.listen(function () {resolve(this.address().port)});
  });

  // client side
  const clientSocket = sioClientFactory(`http://localhost:${port}`);

  const remotableActionsDispatchProtoMapper = new RemotableActionsDispatchProtoMapper({dispatch(msgTypeId, payload) {
    clientSocket.emit(msgTypeId, payload, function(response) {
      console.log('client got back from server: \'' + response + '\'')
    });
  }});

  const source = new Target();
  source.child = new Child('child', target);
  Object.setPrototypeOf(source.child , remotableActionsDispatchProtoMapper.map(Child.prototype));

  source.child.test(1, 2);
})();

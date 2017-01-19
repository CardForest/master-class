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

const tt = {};
class Target {}
class Child {
  async test(...args) {
    return await 'server got ' + args + ' from ' + this.$context.requester.id;
  }
}
declareRemotableActions(Child, 'test');

var target = new Target();
target.$context = tt;
target.$keyPath = [];

target.child = new Child();
target.child.$context = target.$context;
target.child.$keyPath = ['child'];

attachIncomingDispatcher(sioServer, target);

const sioClientFactory = require('socket.io-client');
const {Serializer, Deserializer} = require('./serialization');
const serializer = new Serializer();

const serializedTarget = serializer.serialize(target);

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

  const mappedChildProto = remotableActionsDispatchProtoMapper.map(Child.prototype);

  const deserializer = new Deserializer({classes: {
    Target,
    Child: function() {
      const source = Reflect.construct(Child, []);
      Reflect.setPrototypeOf(source, mappedChildProto);
      return source;
    }
  }});
  const source = deserializer.deserialize(serializedTarget);

  source.child.test(1, 2);

})().catch(console.error.bind(console));



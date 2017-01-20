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

class Target {}
class Child {
  async test(...args) {
    return await 'server got ' + args + ' from ' + this.$context.requester.id;
  }
}
declareRemotableActions(Child, 'test');

const skeleton = require('./skeleton');
let target = new Target()
target.child = new Child();

const httpServer = require('http').createServer();
const sioServer = new (require('./transport/sio-server'))(httpServer);
attachIncomingDispatcher(sioServer, target);

const {Serializer, Deserializer} = require('./serialization');
const serializer = new Serializer();
const serializedTarget = serializer.serialize(skeleton(target));

(async function () {
  const port = await new Promise((resolve) => {
    httpServer.listen(function () {resolve(this.address().port)});
  });

  // client side
  const sioClient = new (require('./transport/sio-client'))(`http://localhost:${port}`);

  const remotableActionsDispatchProtoMapper = new RemotableActionsDispatchProtoMapper(sioClient);

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
  console.log(source.child.$keyPath)

  console.log(`client got back from server: '${await source.child.test(1, 2)}'`);

})().catch(console.error.bind(console));



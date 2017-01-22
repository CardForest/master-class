// remove this after https://github.com/jshint/jshint/issues/2604
// jshint ignore:start

const {SioClient, SioServer} = require('../lib/transport');
const skeleton = require('../lib/skeleton');
const http = require('http');
const {
  declareRemotableActions,
  RemotableActionsDispatchProtoMapper,
  attachIncomingDispatcher,
  attachClientReducer
} = require('../lib/remotable');
const ServerShutdown = require('server-shutdown');
const serverShutdown = new ServerShutdown();
const {Serializer, Deserializer} = require('../lib/serialization');

const assert = require('assert');
const sinon = require('sinon');

describe('transport', function () {
  class Master {}
  class Child {
    async test(...args) {
      this.x = args[0];
      return await 'server got ' + args + ' from ' + this.$context.requester.id;
    }
  }
  declareRemotableActions(Child, 'test');

  let master;
  let sioClient;
  let serializer;
  let deserializer;

  before(async () => {
    const httpServer = http.createServer();
    serverShutdown.registerServer(httpServer);

    const sioServer = new SioServer(httpServer);
    serverShutdown.registerServer(sioServer.sio, ServerShutdown.Adapters.socketio);

    master = new Master();
    master.child = new Child();

    attachIncomingDispatcher(sioServer, master);
    master = skeleton(master, sioServer);

    const port = await new Promise((resolve) => {
      httpServer.listen(function () {resolve(this.address().port)});
    });

    sioClient = new SioClient(`http://localhost:${port}`);
    await sioClient.connect();

    const remotableActionsDispatchProtoMapper = new RemotableActionsDispatchProtoMapper(sioClient);
    const mappedChildProto = remotableActionsDispatchProtoMapper.map(Child.prototype);

    serializer = new Serializer();
    deserializer = new Deserializer({classes: {
      Master,
      Child: function() {
        const source = Reflect.construct(Child, []);
        Reflect.setPrototypeOf(source, mappedChildProto);
        return source;
      }
    }});
  });

  after((done) => {
    serverShutdown.shutdown(done);
  });

  it('should work', async () => {
    const clientView = deserializer.deserialize(serializer.serialize(master));
    attachClientReducer(sioClient, clientView);

    assert.strictEqual(await clientView.child.test(1, 2), 'server got 1,2 from 0');
    assert.strictEqual(clientView.child.x, 1);
  });

  it('facilitates the remotable use-case', () => {
    class C {m() {}}

    declareRemotableActions(C, 'm');

    const dispatch = sinon.spy();
    const remotableActionsDispatchProtoMapper = new RemotableActionsDispatchProtoMapper({dispatch});

    const c = new C();
    Object.setPrototypeOf(c, remotableActionsDispatchProtoMapper.map(C.prototype));
    c.$keyPath = {};

    c.m(1, 2, 3);

    assert(dispatch.calledOnce);
    assert(dispatch.calledWithExactly('action', {targetKeyPath: c.$keyPath, actionType: 'm', args: [1, 2, 3]}));
  });
});

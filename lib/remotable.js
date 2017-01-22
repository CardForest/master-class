// remove this after https://github.com/jshint/jshint/issues/2604
// jshint ignore:start

const ProtoMapper = require('./proto-mapper');
const KeyPath = require('key-path');

function declareRemotableActions(Cls, ...actionKeys) {
  actionKeys.forEach((actionKey) => {
    Reflect.defineMetadata('remotable-action', undefined, Cls.prototype, actionKey);
  });
}

class RemotableActionsDispatchProtoMapper extends ProtoMapper {
  constructor(dispatcher) {
    super({
      'remotable-action': (_, actionType) => function(...args) {
        return dispatcher.dispatch('action', {
          targetKeyPath: this.$keyPath,
          actionType,
          args
        });
      }
    });
  }
}

function attachIncomingDispatcher(incomingChannel, target) {
  incomingChannel.on('action', async function ({targetKeyPath, actionType, args}) {
    const targetValue = KeyPath.get(targetKeyPath).getValueFrom(target);
    if (!(targetValue[actionType] instanceof Function)) {
      throw Error(`no '${actionType}' found in ${JSON.stringify(targetKeyPath)}`);
    }
    target.$context.requester = {id: this.clientId};
    const response = await targetValue[actionType](...args);
    delete target.$context.requester;
    return response;
  });
}

function attachClientReducer(incomingChannel, target) {
  incomingChannel.on('action', function({targetKeyPath, actionType, args}) {
    const targetValue = KeyPath.get(targetKeyPath).getValueFrom(target);
    switch (actionType) {
      case 'set':
        const [{propertyKey, value}] = args;
        targetValue[propertyKey] = value;
        break;
    }
  });
}

module.exports = {
  declareRemotableActions,
  RemotableActionsDispatchProtoMapper,
  attachIncomingDispatcher,
  attachClientReducer
};

const ProtoMapper = require('./proto-mapper');

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

module.exports = {
  declareRemotableActions,
  RemotableActionsDispatchProtoMapper
};

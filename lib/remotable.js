const ProtoMapper = require('./proto-mapper');

function declareRemotableActions(Cls, ...actionKeys) {
  actionKeys.forEach((actionKey) => {
    Reflect.defineMetadata('remotable-action', undefined, Cls.prototype, actionKey);
  });
}

class RemotableMaker {
  constructor({dispatch}) {
    this.remotableActionProtoMapper = new ProtoMapper({
      'remotable-action': (_, actionType) => function(...args) {
        return dispatch('action', {
          targetKeyPath: this.$keyPath,
          actionType,
          args
        });
      }
    });
  }

  make(prototype) {
    return this.remotableActionProtoMapper.map(prototype);
  }
}

module.exports = {
  declareRemotableActions,
  RemotableMaker
};

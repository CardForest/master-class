'use strict';

const assert = require('assert');
const defineActions = require('../lib/define-actions');
const {isArray, isObject} = require('lodash');

class M {}

class ViewMapper {
  map(target, opt) {
    this.opt = opt;
    this.cache = new WeakMap();
    return this._map(target);
  }

  _map(value) {
    if (!(value instanceof Object)) {
      return value;
    }
    const object = value; // just for clear naming

    if (this.cache.has(object)) {
      return this.cache.get(object);
    }

    let mapped;
    if (object.hasOwnProperty('toView')) {
      // custom map function
      mapped = object.toView(this.opt);
    } else if (object instanceof Array) {
      // array
      mapped = object.map(this._map.bind(this));
    } else {
      // regular object
      mapped = {};
      Object.entries(object).forEach(([key, value]) => {
        mapped[key] = this._map(value);
      });
    }

    // save original prototype
    mapped.$$classId = Reflect.getPrototypeOf(object).constructor.name;

    this.cache.set(object, mapped);

    return mapped;
  }

// {
//       this.mapArray(current);
//     } else (isObject(value)) {


    // return isArray(current) ? this.mapArray(value) :
    //   isObject(value) ? this.mapObject(value) :
    //     this.mapFn.call(this.opts.thisArg, value, key);

}


class GamingSession extends M {
  constructor({creator, contextFactory}) {
    super();
  }

  addPlayer() {

  }

  viewOfPlayer(requester) {

  }
}

class Lobby {
  constructor(gamingSessionTypes, contextFactory) {
    this.gamingSessionTypes = gamingSessionTypes;
    this.gamingSessions = {};
    this.contextFactory = contextFactory;
  }
}

defineActions(Lobby, {
  createGamingSession(requester, {gamingSessionTypeId}) {
    const GamingSession = this.gamingSessionTypes[gamingSessionTypeId];
    const gamingSession = new GamingSession({
      creator: requester,
      contextFactory: this.contextFactory
    });
    this.gamingSessions[gamingSession.id] = gamingSession;
    return gamingSession.viewOfPlayer(requester);
  },
  joinGamingSession(requester, {gamingSessionId}) {
    return this.gamingSessions[gamingSessionId].join(requester);
  }
});

class LobbyClient {
  constructor() {}

  createGamingSession({gamingSessionTypeId, creatorId}) {
    const GamingSession = this.gamingSessionTypes[gamingSessionTypeId];
    const gamingSession = new GamingSession({
      creatorId,
      contextFactory: this.contextFactory
    });
    this.gamingSessions[gamingSession.id] = gamingSession;
  }

  joinGamingSession({gamingSessionId, playerId}) {
    return this.gamingSessions[gamingSessionId].join(playerId);
  }
}

class Player {
}

defineActions(Player, {
  createGamingSession(gamingSessionTypeId) {
    return this.$context.lobby.createGamingSession({
      gamingSessionTypeId,
      creatorId: this.$id
    });
  },
  joinGamingSession(gamingSessionId) {
    return this.$context.lobby.joinGamingSession({
      gamingSessionId,
      playerId: this.$id
    });
  }
});



describe.skip('GamingSession', () => {
  let gamingSessionMasterContext;
  let localPlayerContext;
  let messageLog;
  let lobby;

  beforeEach(() => {
    messageLog = [];
    lobby = new Lobby();

    gamingSessionMasterContext = {
      isProxy: false,
      dispatch(msgType, payload) {
        messageLog.push({msgType, payload});
      }
    };

    localPlayerContext = {};
  });

  it('xxx', () => {

    class Whist extends GamingSession {}
    lobby.registerGameTypes({Whist});

    const ownPlayer = new Player({
      context: localPlayerContext
    });

    const whist = new Whist({
      context: gamingSessionMasterContext
    });






    whist.addPlayer({});
    whist.addPlayer({});
    whist.addPlayer({});
    whist.addPlayer({});

  });
});

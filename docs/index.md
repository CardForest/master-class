---
title: Getting Started
description: "Stateful JavaScript models: share a view, save the full state."
---

What a client needs to see is not always what an application needs to remember.
Master-Class lets you model behavior that changes with state, choose what to
export for each client, and save the model independently of those views.

This guide uses a card round to make the distinction concrete. Each player
sees one card; the server needs both to reveal them, resume an interrupted
game, or revisit the deal later.

## Install

Latest tested on Node.js 24.

```sh
npm install master-class
```

## Model the round as a state machine

```js
const M = require('master-class');

const Game = M({
  revealed: false,
  players: [{card: M.String({scope: 'owner'})}],
  round: M.State([
    {
      when() { return !this.root.revealed; },
      delegate: M({reveal() { this.root.revealed = true; }})
    },
    {
      when() { return this.root.revealed; },
      delegate: M({label: 'Showdown'})
    }
  ])
});
```

Each *delegate* supplies fields or moves while its condition is true.
Before showdown, `round.reveal()` is available. Calling it changes the phase:
the move disappears and `round.label` becomes `"Showdown"`. The cards belong
to the players, not the phase, so they survive the transition.

## Send a view, not the server's save

```js
const game = new Game({players: [{card: 'Ace'}, {card: 'King'}]});

function messageFor(game, seat) {
  const view = game.export((options, value, path, copy) => {
    // The path to a card is ['players', seatIndex, 'card'].
    if (!game.revealed && options.scope === 'owner' && path[1] !== seat) {
      return 'face down';
    }
    return copy();
  });
  return JSON.stringify(view);
}

const message = messageFor(game, 0);
console.log(JSON.parse(message).players); // [{card: 'Ace'}, {card: 'face down'}]
console.log(JSON.parse(messageFor(game, 1)).players); // [{card: 'face down'}, {card: 'King'}]
```

`scope: 'owner'` is a label the mapper reads, not an automatic permission.
On the server, choose the seat from the authenticated connection and send
that connection its own message. The client can render the parsed JSON;
it doesn't need the opponent's card or a live `Game` instance.

## Keep turn history and resume a save

```js
const history = [game.serialize()]; // The deal, before the move.
game.round.reveal();
history.push(game.serialize());     // The completed move.

console.log(game.round.label); // Showdown
console.log(JSON.parse(messageFor(game, 0)).players); // [{card: 'Ace'}, {card: 'King'}]
```

```js
const resumed = Game.deserialize(history[1]);
console.log(resumed.round.label); // Showdown

const atDeal = Game.deserialize(history[0]);
console.log(typeof atDeal.round.reveal); // function: the move is available again
console.log(JSON.parse(messageFor(atDeal, 0)).players[1].card); // face down
```

These are checkpoints, not a move log. Your server chooses when to take them
and where to store them. Persist the latest string to resume a game with the
same schema, or keep earlier strings to inspect previous turns. For a player's
history screen, restore the chosen turn on the server and export that player's
view **at that turn**. Sending the checkpoint itself would reveal both cards.

## TypeScript

The package includes TypeScript declarations. Install `@types/node` and add
`"types": ["node"]` to your TypeScript compiler options.

```ts
import M = require('master-class');

const Person = M({
  name: String,
  age: Number,
  birthday(years: number) {
    this.age += years;
  }
});

const person = new Person({name: 'Ada', age: 36});
person.birthday(1);
// person.age = 'wrong'; // Rejected by TypeScript and at runtime.
```

Primitive, object, array, getter, and mutator types are inferred from schemas.
State properties and exports are dynamic and exposed as `unknown`.

## Guides

- [Strict typing](./strict-typing.md)
- [Change control](./change-control.md)
- [Serialization](./serialization.md)
- [The state pattern](./state-pattern.md)

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html).

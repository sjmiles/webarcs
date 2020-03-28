/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {irand, prob} from './utils.js';
import {Actor} from './connect.js';

let actorA = new Actor('A');
actorA.ring('B');

let actorB = new Actor('B');

const send = (actor, peer, i) => {
  actor.send(peer, i);
  if (--i) {
    if (prob(0.5)) {
      send(actor, peer, i);
    } else {
      setTimeout(() => send(actor, peer, i), irand(100));
    }
  }
};

window.send = () => {
  send(actorA, 'B', 4);
  send(actorB, 'A', 4);
};

window.reconnect = () => {
  actorA = new Actor('A');
  actorA.ring('B');
};
//send();

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
import {Peers} from './peers.js';
import {database} from '../firebase.js';

const dbroot = database.ref(`webarcs/v0/`);

let actorA = new Actor('A');
const peersA = new Peers(dbroot, 'A');
peersA.onpeerschanged = () => {
  console.log('peersA: ', peersA.peers);
  if (!peersA.peers) {
    peersA.add('B');
  }
  peersA.peers.forEach(peer => actorA.ring(peer));
};
peersA.fetch();

let actorB = new Actor('B');
const peersB = new Peers(dbroot, 'B');
peersB.onpeerschanged = () => {
  console.log('peersB: ', peersB.peers);
  if (!peersB.peers) {
    peersB.add('A');
  }
  peersB.peers.forEach(peer => actorB.ring(peer));
};
peersB.fetch();

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


/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {irand} from './utils.js';
import {Actor} from './connect.js';
import {Peers} from './peers.js';
import {deviceId} from './device.js';
import {database} from '../firebase.js';
import {Automerge} from '../automerge.js';

// DocSet

const docSet = new Automerge.DocSet();
docSet.registerHandler((docId, doc) => {
  dump();
});

// Comms

const dbroot = database.ref(`webarcs/v0/`);

const actor = new Actor(deviceId);

actor.connections = {};
const connectPeer = peer => {
  actor.ring(peer);
}
actor.onchannel = peer => {
  let conn = actor.connections[peer];
  if (conn) {
    console.warn('closing existing connection', peer);
    conn.close();
  }
  console.warn('opening connection', peer);
  conn = new Automerge.Connection(docSet, msg => actor.send(peer, msg));
  conn.open();
  actor.connections[peer] = conn;
}
actor.onreceive = (peer, msg) => {
  const conn = actor.connections[peer];
  conn.receiveMsg(msg);
};

const peers = new Peers(dbroot, deviceId);
peers.onpeerschanged = () => {
  peers.peers.forEach(peer => connectPeer(peer));
  showPeers();
};
peers.fetch();

// UI

const {actorIdElt, addPeerElt, writeProfileElt, peerIdElt, peersElt,
   connectedPeersElt, docsElt, mutateElt, log, nameElt} = window;

const showPeers = () => {
  peersElt.innerText = JSON.stringify(peers.peers, null, 2);
};

addPeerElt.onclick = () => {
  const peer = peerIdElt.value.trim();
  peers.add(peer);
  connectPeer(peer);
  showPeers();
};

const dump = window.dump = () => {
  const serial = JSON.stringify(docSet.docs, null, 2);
  docsElt.innerText = serial;
};

nameElt.onchange = ({target: {value}}) => {
  let doc = docSet.getDoc(deviceId) || Automerge.init();
  doc = Automerge.change(doc, doc => {
    doc.profile = `My name is ${value}`;
  });
  docSet.setDoc(deviceId, doc);
}

const mutate = () => {
  let doc = docSet.getDoc('a') || Automerge.init();
  doc = Automerge.change(doc, doc => {
    let color;
    do {
      color = ['red', 'green', 'blue', 'yellow', 'cyan'][irand(5)];
    } while (doc.color === color)
    doc.color = color;
  });
  docSet.setDoc('a', doc);
};

mutateElt.onclick = mutate;

document.body.style.opacity = 1;

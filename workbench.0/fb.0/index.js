/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Params} from '../params.js';
import {Perge} from './perge.js';
import {makeId} from './utils.js';

// globals (grr)
const {Automerge, Peer} = window;

let deviceId = Params.getParam('device');
if (!deviceId) {
  deviceId = makeId();
  Params.setParam('device', deviceId);
}
Params.prefix = `${deviceId}:`;

//let actorId = Params.fetchValue('actorId');
//if (!actorId) {
const actorId = makeId();
//  Params.storeValue('actorId', actorId);
//}

//

//import {Peer} from './peer.js';

// var peer = new Peer();
// peer.on('open', function(id) {
//   msg('peer ID is' + id);
// });

//

import {database} from '../firebase.js';

const dbroot = database.ref(`webarcs/v0/`);
const rendezvous = dbroot.child('rendezvous');

const signalRendezvous = (id, actorId) => {
  console.log(`signalRendezvous: ${id}:${actorId}`);
  rendezvous.child(id).set({actorId});
};

const observeRendezvous = peer => {
  console.log(`observeRendezvous: ${peer}`);
  rendezvous.child(peer).on('value', snap => {
    const value = snap.val();
    console.log(`observeRendezvous.on('value'): ${peer}:`, value);
    if (value.actorId) {
      connectToPeer(value.actorId);
    }
  });
};

const addPeer = id => {
  if (id && !peers.includes(id)) {
    peers.push(id);
    showPeers();
    Params.storeJsonValue('peers', peers);
    observeRendezvous(id);
  }
};

const connectToPeer = id => {
  instance.connect(id);
  console.log(`connected to perge instance for [${id}]`);
  showPeers();
};

//

let docSet;
let instance;

const {actorIdElt, addPeerElt, connectElt, peerIdElt, peersElt, connectedPeersElt, docsElt, docIdElt, incrElt, log} = window;

const initPeerJs = () => {
  // Instantiate a PeerJS connection
  console.log(`initiated PeerJs instance for [${actorId}]`);
  // Instantiate an Automerge.DocSet
  docSet = new Automerge.DocSet();
  // Instantiate Perge library
  instance = new Perge(actorId, {
    decode: JSON.parse, // msgpack or protobuf would also be a good option
    encode: JSON.stringify,
    docSet
  });
  // This handler gets invoked whenever the DocSet is updated, useful for re-rendering views.
  instance.subscribe(() => {
    docsElt.innerText = JSON.stringify(docSet.docs, null ,2);
  });
  instance.onlostpeer = conn => {
    console.log(`onlostpeer: [${conn.peer}]`);
    showPeers();
  };
  console.log(`subscribed to perge instance for [${actorId}]`);
};

initPeerJs();
signalRendezvous(deviceId, actorId);

const showPeers = () => {
  peersElt.innerText = JSON.stringify(peers, null, 2);
  connectedPeersElt.innerText = instance && JSON.stringify(Object.keys(instance._connections), null, 2);
};

addPeerElt.onclick = () => {
  addPeer(peerIdElt.value.trim());
};

const msg = msg => {
  console.log(msg);
  log.appendChild(document.createElement('div')).innerText = msg;
};

let peers = Params.fetchJsonValue('peers') || [];
showPeers();

connectElt.onclick = () => {
  peers.forEach(id => observeRendezvous(id));
};

actorIdElt.innerText = deviceId;

const getDocId = () => docIdElt.value || 'default';

incrElt.onclick = () => {
  const id = getDocId();
  // Update the document
  const docAgent = instance.select(id);
  docAgent(
    Automerge.change,
    'increase counter',
    doc => {
      if (!doc.counter) doc.counter = new Automerge.Counter();
      else doc.counter.increment();
    }
  );
};

document.body.style.opacity = 1;

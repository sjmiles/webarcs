/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Perge} from './perge.js';

// DOM elements
const {/*nameElt, */addPeerElt, peerIdElt, connectElt, connectedPeersElt, docs, actorEl, incrEl, docIdEl,
    peersElt, autoElt} = window;

// globals (grr)
const {cuid, Automerge, Peer} = window;

//

const version = 'v0';

const url = new URL(document.URL);
const params = url.searchParams;
const getParam = (name) => {
  return params.get(name);
};
const setParam = (name, value) => {
  params.set(name, value);
  window.history.replaceState({}, '', decodeURIComponent(url.href));
};

let deviceId = getParam('device');
if (!deviceId) {
  deviceId = cuid();
  setParam('device', deviceId);
}

const prefix = `(wa_perge_version:${version})(device:${deviceId})`;

const qualifyName = name => {
  return `${prefix}::${name}`;
};
const fetchValue = name => {
  return localStorage.getItem(qualifyName(name));
};
const storeValue = (name, value) => {
  return localStorage.setItem(qualifyName(name), value);
};

// const setUserName = name => {
//   if (name) {
//     nameElt.value = name;
//     storeValue('name', name);
//     actorIdField = `actorId:${name}`;
//     setActorId(fetchValue(actorIdField));
//   }
// };

const setActorId = id => {
  actorId = id || cuid();
  actorEl.innerText = actorId;
  storeValue(actorIdField, actorId);
  initPerge();
};

const initPerge = () => {
  // Instantiate a PeerJS connection
  peerInstance = new Peer(actorId);
  console.log(`initiated PeerJs instance for [${actorId}]`);
  // Instantiate an Automerge.DocSet
  docSet = new Automerge.DocSet();
  // Instantiate Perge library
  instance = new Perge(actorId, {
    decode: JSON.parse, // msgpack or protobuf would also be a good option
    encode: JSON.stringify,
    peerInstance,
    docSet
  });
  // This handler gets invoked whenever the DocSet is updated, useful for re-rendering views.
  instance.subscribe(() => {
    docs.innerText = JSON.stringify(docSet.docs, null ,2);
  });
  instance.onlostpeer = conn => {
    console.log(`onlostpeer: [${conn.peer}]`);
    showPeers();
  };
  console.log(`subscribed to perge instance for [${actorId}]`);
};

const connectToPeer = id => {
  instance.connect(id, peerInstance.connect(id));
  console.log(`connected to perge instance for [${id}]`);
  showPeers();
};

const addPeer = id => {
  if (id && !peers.includes(id)) {
    peers.push(id);
    showPeers();
    storeValue('peers', JSON.stringify(peers));
    connectToPeer(id);
  }
};

const showPeers = () => {
  peersElt.innerText = JSON.stringify(peers, null, 2);
  connectedPeersElt.innerText = JSON.stringify(Object.keys(instance._connections), null, 2);
};

window.showPeers = showPeers;

//

let actorId;
let peers;
let peerInstance;
let instance;
let docSet;

const actorIdField = `actorId`;
setActorId(fetchValue(actorIdField));

// setUserName(fetchValue('name'));
// nameElt.onchange = ({target: {value}}) => {
//   setUserName(value);
// };

peers = JSON.parse(fetchValue('peers')) || [];
showPeers();

connectElt.onclick = () => {
  peers.forEach(id => connectToPeer(id));
};

addPeerElt.onclick = () => {
  addPeer(peerIdElt.value);
};

//

const getDocId = () => docIdEl.value || 'default';

incrEl.onclick = () => {
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

const autoconnect = () => {
  const connected = Object.keys(instance._connections);
  peers.forEach(p => {
    if (!connected.includes(p)) {
      console.log(':: attempting to connect to ', p);
      connectToPeer(p);
    }
  });
};

autoElt.click();

autoElt.onchange = ({target: {checked}}) => {
  if (checked) {
    autoconnect.interval = setInterval(autoconnect, 1000);
  } else {
    clearInterval(autoconnect.interval);
  }
  console.log('autoconnect', checked);
};

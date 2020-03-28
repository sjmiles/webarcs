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

const {cuid, Automerge, Peer} = window;

const docs = document.getElementById('docs');
const actorEl = document.getElementById('actorId');
const incrEl = document.getElementById('incrEl');
const docIdEl = document.getElementById('docIdEl');
const peerForm = document.getElementById('peerForm');
const peersEl = document.getElementById('peersEl');

const getDocId = () => docIdEl.value || 'default';

//

const url = new URL(document.URL);
const params = url.searchParams;
const getParam = name => {
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

const version = 'v0';
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

let actorId = fetchValue('actorId');
if (!actorId) {
  actorId = cuid();
  storeValue('actorId', actorId);
}

//

// Unique ID for this user
//const actorId = cuid();
actorEl.innerText = actorId;

// Instantiate a PeerJS connection
const peerInstance = new Peer(actorId);
console.log(`initiated PeerJs instance for [${actorId}]`);

// Instantiate an Automerge.DocSet
let docSet = new Automerge.DocSet();

// Instantiate Perge library
const instance = new Perge(actorId, {
  decode: JSON.parse, // msgpack or protobuf would also be a good option
  encode: JSON.stringify,
  peerInstance: peerInstance,
  docSet: docSet
});

// This handler gets invoked whenever the DocSet is updated, useful for re-rendering views.
instance.subscribe(() => {
  docs.innerText = JSON.stringify(docSet.docs, null ,2);
});
console.log(`subscribed to perge instance for [${actorId}]`);

incrEl.onclick = () => {
  const id = getDocId();
  // Update the document
  instance.select(id)(
    Automerge.change,
    'increase counter',
    doc => {
      if (!doc.counter) doc.counter = new Automerge.Counter();
      else doc.counter.increment();
    }
  );
};

peerForm.onsubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(peerForm);
  const peerId = formData.get('peerId');
  //addPeer(peerId);
  connectToPeer(peerId);
};

const connectToPeer = id => {
  instance.connect(id, peerInstance.connect(id));
  console.log(`connected to perge instance for [${id}]`);
  peersEl.innerText = JSON.stringify(
    Array.from(peerInstance._connections.keys()
  ), null, 2);
};

let peers = JSON.parse(fetchValue('peers')) || [];
console.log('saved peers:', peers);
setTimeout(() => {
  //peers.forEach(id => connectToPeer(id));
}, 1000);

const addPeer = id => {
  if (id && !peers.includes(id)) {
    peers.push(id);
    storeValue('peers', JSON.stringify(peers));
    connectToPeer(id);
  }
};

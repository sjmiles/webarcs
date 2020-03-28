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
import {deviceId} from './device.js';
import {database} from '../firebase.js';

// globals (grr)
const {Automerge} = window;

const dbroot = database.ref(`webarcs/v0/`);
const rendezvous = dbroot.child('rendezvous');
const profile = dbroot.child('profile');
const channels = dbroot.child('channels');
const docs = dbroot.child('docs');

let peers = [];
let peerConnections = {};

const ring = (peer, id) => {
  // ring ... ring
  rendezvous.child(peer).child(id).set('ring' + (irand(100) + 100));
};

const listen  = (id) => {
  // ring ... ring
  rendezvous.child(id).once('value', snap => {
    const value = snap.val();
    console.log(`listen.on('value'): ${id}:`, value);
    if (value) {
      peers = Object.keys(value);
      console.log(peers);
      showPeers();
      peers.forEach(p => ring(p, id));
      connectPeers(peers);
    }
  });
  rendezvous.child(id).on('child_changed', snap => {
    console.warn('peer re-ringed: ', snap.key);
    const conn = connections[snap.key];
    if (conn) {
      console.warn('closing old connection');
      delete connections[snap.key];
      conn.off();
      //channels.child(snap.key).child(deviceId).remove();
    }
    console.warn('re-connecting');
    connect(deviceId, docSet, snap.key);
  });
};

const showPeers = () => {
  peersElt.innerText = JSON.stringify(peers, null, 2);
  connectedPeersElt.innerText = JSON.stringify(peerConnections, null, 2);
};

const msg = msg => {
  console.log(msg);
  log.appendChild(document.createElement('div')).innerText = msg;
};

// signalling

const {actorIdElt, addPeerElt, writeProfileElt, peerIdElt, peersElt,
  connectedPeersElt, docsElt, mutateElt, log, nameElt} = window;

actorIdElt.innerText = deviceId;
listen(deviceId);
showPeers();
document.body.style.opacity = 1;

const connectPeers = (peers) => {
  peers.forEach(p => {
    if (!peerConnections[p]) {
      //console.log(`listening to [profile/${p}/]`);
      const c = peerConnections[p] = {
        $listener: profile.child(p).on('value', snap => {
          //console.log(`value from [profile/${p}/]`);
          const value = snap.val();
          c.value = value;
          showPeers();
        })
      };
    }
  });
  peers.forEach(peer => connect(deviceId, docSet, peer));
};

const connections = {};

const connect = (id, docSet, peer) => {
  // a channel under our `id` for `peer`
  const ours = channels.child(id).child(peer);
  const connection = connections[peer] = new Automerge.Connection(docSet, msg => {
    console.log(`sending to ${ours.ref.toString()}`, msg);
    ours.set(JSON.stringify(msg));
  });
  // a channel under `peer` for our `id`
  const theirs = channels.child(peer).child(id);
  // evacipate stale data
  theirs.remove();
  // on opening the connection, the doc-set is iterated
  // and connection does maybeSendChanges for each doc
  connection.open();
  const listener = theirs.on('value', snap => {
    // consume this message
    //theirs.remove();
    // extract the data
    const msg = JSON.parse(snap.val());
    console.log(`received from ${theirs.ref.toString()}`, msg);
    if (msg) {
      connection.receiveMsg(msg);
      dump();
    }
  });
  connection.off = () => {
    theirs.off('value', listener);
    connection.close();
  };
  return connection;
};

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

const docSet = new Automerge.DocSet();
nameElt.onchange = ({target: {value}}) => {
  let doc = docSet.getDoc(deviceId) || Automerge.init();
  doc = Automerge.change(doc, doc => {
    doc.profile = `My name is ${value}`;
    //docSet.setDoc(deviceId, Automerge.from({profile: `My name is ${value}`}));
  });
  docSet.setDoc(deviceId, doc);
}
//mutate();

const dump = window.dump = () => {
  const serial = JSON.stringify(docSet.docs, null, 2);
  docsElt.innerText = serial;
};

docSet.registerHandler((docId, doc) => {
  dump();
  const serial = JSON.stringify(docSet.docs);
  docs.child(deviceId).set(serial);
});

//setTimeout(mutate, 1000);

addPeerElt.onclick = () => {
  //addPeer(peerIdElt.value.trim());
  ring(peerIdElt.value.trim(), deviceId);
};

writeProfileElt.onclick = () => {
  const data = `Hello, I am ${deviceId}, I like ${['pie', 'cake', 'glue', 'air'][irand(4)]}`;
  profile.child(deviceId).set(data);
  //console.log(`wrote [profile/${deviceId}/${JSON.stringify(data)}]`);
};

const mutateN = () => {
  let i = 10;
  const it = () => {
    mutate();
    if (--i) {
      setTimeout(it, irand(300) + 150);
    }
  };
  it();
};

mutateElt.onclick = () => {
  mutate();
  //mutateN();
};
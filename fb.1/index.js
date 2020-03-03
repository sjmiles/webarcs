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
import {makeId, irand} from './utils.js';

// globals (grr)
const {Automerge} = window;

// identification

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

// processing junk

import {database} from '../firebase.js';

const dbroot = database.ref(`webarcs/v0/`);
const rendezvous = dbroot.child('rendezvous');
const profile = dbroot.child('profile');

let peers = [];
let peerConnections = {};

const ring = (peer, id) => {
  // ring ... ring
  rendezvous.child(peer).child(id).set('ring');
};

const listen  = (id) => {
  // ring ... ring
  rendezvous.child(id).on('value', snap => {
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
};

// const setDatastore = (id, data) => {
//   console.log(`setDatastore: ${id}: data`);
//   rendezvous.child(id).set(data);
// };

// const observeDatastore = peer => {
//   console.log(`observeDatastore: ${peer}`);
//   rendezvous.child(peer).on('value', snap => {
//     const value = snap.val();
//     console.log(`observeDatastore.on('value'): ${peer}:`, value);
//   });
// };

// const addPeer = id => {
//   if (id && !peers.includes(id)) {
//     peers.push(id);
//     showPeers();
//     Params.storeJsonValue('peers', peers);
//     observeDatastore(id);
//   }
// };

// const connectToPeer = id => {
//   //instance.connect(id);
//   //console.log(`connected to perge instance for [${id}]`);
//   showPeers();
// };

const showPeers = () => {
  peersElt.innerText = JSON.stringify(peers, null, 2);
  connectedPeersElt.innerText = JSON.stringify(peerConnections, null, 2);
};

const msg = msg => {
  console.log(msg);
  log.appendChild(document.createElement('div')).innerText = msg;
};

// signalling

const {actorIdElt, addPeerElt, writeProfileElt, connectElt, peerIdElt, peersElt, connectedPeersElt, docsElt, docIdElt, incrElt, log} = window;

actorIdElt.innerText = deviceId;

//setDatastore(deviceId, `all my children (${actorId}`);
listen(deviceId);

addPeerElt.onclick = () => {
  //addPeer(peerIdElt.value.trim());
  ring(peerIdElt.value.trim(), deviceId);
};

writeProfileElt.onclick = () => {
  const data = `Hello, I am ${deviceId}, I like ${['pie', 'cake', 'glue', 'air'][irand(4)]}`;
  profile.child(deviceId).set(data);
  console.log(`wrote [profile/${deviceId}/${JSON.stringify(data)}]`);
};

// let peers = Params.fetchJsonValue('peers') || [];
showPeers();

// connectElt.onclick = () => {
//   peers.forEach(id => observeDatastore(id));
// };

document.body.style.opacity = 1;

const connectPeers = (peers) => {
  peers.forEach(p => {
    if (!peerConnections[p]) {
      console.log(`listening to [profile/${p}/]`);
      const c = peerConnections[p] = {
        $listener: profile.child(p).on('value', snap => {
          console.log(`value from [profile/${p}/]`);
          const value = snap.val();
          c.value = value;
          showPeers();
        })
      };
    }
  });
  peers.forEach(peer => connect(peer, docSet));
};
//connectPeers(peers);

const channels = dbroot.child('channels');
const connections = {};

const connect = (id, docSet, peer) => {
  const connection = connections[id] = new Automerge.Connection(docSet, msg => {
    console.log(msg);
    //channels.child(peer).set(msg);
  });
  connection.open();
  return connection;
};

const docSet = new Automerge.DocSet();

setTimeout(() => {
  let doc = Automerge.init();
  doc = Automerge.change(doc, doc => {
    doc.color = ['red', 'green', 'blue'][irand(3)];
  });
  docSet.setDoc('a', doc);
}, 1000);

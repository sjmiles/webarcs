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
// import {deviceId} from './device.js';
// import {database} from '../firebase.js';

// globals (grr)
// const {Automerge} = window;

// const dbroot = database.ref(`webarcs/v0/`);
// const rendezvous = dbroot.child('rendezvous');
// const profile = dbroot.child('profile');
// const channels = dbroot.child('channels');
// const docs = dbroot.child('docs');

let peers = [];
//let peerConnections = {};
let connections = {};

let rootDb;
let ourDb;
let rendezvous;
let peersDb;
let personaId;
let docSet;
let empty;
let pending = [];

const async = task => {
  return async (...args) => {
    await Promise.resolve();
    task(...args);
  };
};

export const Peers = class {
  static init(dbroot, id, docs) {
    rootDb = dbroot;
    rendezvous = dbroot.child('rendezvous');
    //channels = dbroot.child('channels');
    ourDb = dbroot.child(id);
    peersDb = ourDb.child('peers');
    personaId = id;
    docSet = docs;
    this.observePeers();
    this.observeRendezvous();
  }
  static onpeerschanged() {
  }
  static get peers() {
    return peers;
  }
  static onconnectionschanged() {
  }
  static get connections() {
    return connections;
  }
  static add(peer) {
    if (peers.includes(peer)) {
      this.validateConnection(peer);
    } else {
      peersDb.child(peer).set(true);
    }
  }
  static observePeers() {
    peersDb.on('child_added', async(snap => this.observePeer(snap.key)));
  }
  static observePeer(peer) {
    if (peers.includes(peer)) {
      //console.warn('addPeer: peer already exists');
    } else {
      console.log(`observePeer: [${peer}]`);
      peers.push(peer);
      this.ring(peer);
      //this.connect(peer);
      this.onpeerschanged();
    }
    this.validateConnection(peer);
  }
  // extend connection invite for peer` (rendezvous/[peer]/[id] = cookie)
  static ring(peer) {
    console.log(`ring: [${peer}]`);
    rendezvous.child(peer).child(personaId).set('ring' + (irand(100) + 100));
  }
  // observe connection invites
  static observeRendezvous() {
    rendezvous.child(personaId).on('child_added', async(snap => {
      console.log('rendezvous record added: ', snap.key);
      snap.ref.remove();
      const peer = snap.key;
      this.add(peer);
    }));
  };
  static validateConnection(peer) {
    if (connections[peer]) {
      console.warn('RECONNECT', peer);
      this.reconnect(peer);
    } else {
      console.warn('connect', peer);
      this.connect(peer);
    }
    this.onconnectionschanged();
  }
  static connect(peer) {
    connections[peer] = this._connect(peer);
  }
  static _connect(peer) {
    empty = true;
    // the channel under our `id` for `peer`
    const ours = ourDb.child('channels').child(peer);
    //const ours = channels.child(personaId).child(peer);
    // construct Automerge.Connection protocol handler
    const connection = new Automerge.Connection(docSet, msg => {
      if (empty) {
        console.log(`sending to [${peer}]`, msg);
        //console.log(ours.ref.toString().slice(47));
        ours.set(JSON.stringify(msg));
        empty = false;
      } else {
        console.log(`waiting to send to [${peer}]`, msg);
        pending.push(msg);
      }
    });
    ours.on('value', async(snap => {
      const value = snap.val();
      empty = !value;
      //console.log('OUR channel reports', empty ? 'EMPTY': 'full');
      if (empty) {
        const msg = pending.shift();
        if (msg) {
          console.log(`sending (pending) to [${peer}]`, msg);
          //console.log(ours.ref.toString().slice(47));
          ours.set(JSON.stringify(msg));
          empty = false;
        }
      }
    }));
    // a channel under `peer` for our `id`
    const theirs = rootDb.child(peer).child('channels').child(personaId);
    //const theirs = channels.child(peer).child(personaId);
    // evacipate stale data
    //theirs.remove();
    const listener = theirs.on('value', async(snap => {
      // extract the data
      const msg = JSON.parse(snap.val());
      console.log(`received from [${peer}]`, msg);
      if (msg) {
        //console.log(theirs.ref.toString().slice(47));
        // let automerge-connection do the work
        connection.receiveMsg(msg);
        // consume this message
        theirs.remove();
        //dump();
      }
    }));
    connection.off = () => {
      theirs.off('value', listener);
      console.log(`closing Automerge.Connection to [${peer}]`);
      connection.close();
      //ours.remove();
      //theirs.remove();
    };
    console.log(`opening Automerge.Connection to [${peer}]`);
    // on opening the connection, the doc-set is iterated
    // and connection does maybeSendChanges for each doc
    connection.open();
    return connection;
  }
  static disconnect(peer) {
    pending = [];
    const conn = connections[peer];
    delete connections[peer];
    conn.off();
  }
  static reconnect(peer) {
    this.disconnect(peer);
    this.connect(peer);
  }
}

// const showPeers = () => {
//   peersElt.innerText = JSON.stringify(peers, null, 2);
//   connectedPeersElt.innerText = JSON.stringify(peerConnections, null, 2);
// };

// const msg = msg => {
//   console.log(msg);
//   log.appendChild(document.createElement('div')).innerText = msg;
// };

// // signalling

// const {actorIdElt, addPeerElt, writeProfileElt, peerIdElt, peersElt,
//   connectedPeersElt, docsElt, mutateElt, log, nameElt} = window;

// actorIdElt.innerText = deviceId;
// listen(deviceId);
// showPeers();
// document.body.style.opacity = 1;

// const connectPeers = (peers) => {
//   peers.forEach(p => {
//     if (!peerConnections[p]) {
//       //console.log(`listening to [profile/${p}/]`);
//       const c = peerConnections[p] = {
//         $listener: profile.child(p).on('value', snap => {
//           //console.log(`value from [profile/${p}/]`);
//           const value = snap.val();
//           c.value = value;
//           showPeers();
//         })
//       };
//     }
//   });
//   peers.forEach(peer => connect(deviceId, docSet, peer));
// };

// const connections = {};

// const connect = (id, docSet, peer) => {
//   // a channel under our `id` for `peer`
//   const ours = channels.child(id).child(peer);
//   const connection = connections[peer] = new Automerge.Connection(docSet, msg => {
//     console.log(`sending to ${ours.ref.toString()}`, msg);
//     ours.set(JSON.stringify(msg));
//   });
//   // a channel under `peer` for our `id`
//   const theirs = channels.child(peer).child(id);
//   // evacipate stale data
//   theirs.remove();
//   // on opening the connection, the doc-set is iterated
//   // and connection does maybeSendChanges for each doc
//   connection.open();
//   const listener = theirs.on('value', snap => {
//     // consume this message
//     //theirs.remove();
//     // extract the data
//     const msg = JSON.parse(snap.val());
//     console.log(`received from ${theirs.ref.toString()}`, msg);
//     if (msg) {
//       connection.receiveMsg(msg);
//       dump();
//     }
//   });
//   connection.off = () => {
//     theirs.off('value', listener);
//     connection.close();
//   };
//   return connection;
// };

// const mutate = () => {
//   let doc = docSet.getDoc('a') || Automerge.init();
//   doc = Automerge.change(doc, doc => {
//     let color;
//     do {
//       color = ['red', 'green', 'blue', 'yellow', 'cyan'][irand(5)];
//     } while (doc.color === color)
//     doc.color = color;
//   });
//   docSet.setDoc('a', doc);
// };

// const docSet = new Automerge.DocSet();
// nameElt.onchange = ({target: {value}}) => {
//   let doc = docSet.getDoc(deviceId) || Automerge.init();
//   doc = Automerge.change(doc, doc => {
//     doc.profile = `My name is ${value}`;
//     //docSet.setDoc(deviceId, Automerge.from({profile: `My name is ${value}`}));
//   });
//   docSet.setDoc(deviceId, doc);
// }
// //mutate();

// const dump = window.dump = () => {
//   const serial = JSON.stringify(docSet.docs, null, 2);
//   docsElt.innerText = serial;
// };

// docSet.registerHandler((docId, doc) => {
//   dump();
//   const serial = JSON.stringify(docSet.docs);
//   docs.child(deviceId).set(serial);
// });

// //setTimeout(mutate, 1000);

// addPeerElt.onclick = () => {
//   //addPeer(peerIdElt.value.trim());
//   ring(peerIdElt.value.trim(), deviceId);
// };

// writeProfileElt.onclick = () => {
//   const data = `Hello, I am ${deviceId}, I like ${['pie', 'cake', 'glue', 'air'][irand(4)]}`;
//   profile.child(deviceId).set(data);
//   //console.log(`wrote [profile/${deviceId}/${JSON.stringify(data)}]`);
// };

// const mutateN = () => {
//   let i = 10;
//   const it = () => {
//     mutate();
//     if (--i) {
//       setTimeout(it, irand(300) + 150);
//     }
//   };
//   it();
// };

// mutateElt.onclick = () => {
//   mutate();
//   //mutateN();
// };

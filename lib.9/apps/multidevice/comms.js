/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {irand} from '../../lib/js/utils/utils.js';
import {Actor} from '../../lib/connect/connect.js';
import {Peers} from '../../lib/connect/peers.js';
import {database} from '../../../firebase.js';
import {Automerge} from '../../../automerge.js';

// DocSet

export const docSet = new Automerge.DocSet();

docSet.registerHandler((docId, doc) => {
  dump();
  Comms.ondocsetchange(docSet, docId, doc);
});

const dump = () => {
  const serial = JSON.stringify(docSet.docs, null, 2);
  console.groupCollapsed('docs');
  console.log(serial);
  console.groupEnd();
};

// Comms

const dbroot = database.ref(`webarcs/v0/`);

export const Comms = class {
  static get dbroot() {
    return dbroot;
  }
  static get docSet() {
    return docSet;
  }
  static ondocsetchange(docSet, docId, doc) {
  }
  static init(deviceId) {
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

    const addPeer = peer => {
      peers.add(peer);
      connectPeer(peer);
      showPeers();
    };
    window.addPeer = addPeer;

    const removePeer = peer => {
      peers.remove(peer);
      showPeers();
    };
    window.removePeer = removePeer;

    const showPeers = () => {
      console.log('peers: ', peers.peers);
      const {peersElt} = window;
      if (peersElt) {
        const html = peers.peers.map(p => `<span style="color: green; font-size: 28px; vertical-align: middle;">&bull;&nbsp;</span>${p}`).join('<br>');
        peersElt.innerHTML = html;
      }
    };
  }
};

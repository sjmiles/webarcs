/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {async} from './utils.js';

export const Peers = class {
  constructor(dbroot, id) {
    this.rootDb = dbroot;
    this.ourDb = this.rootDb.child(id);
    this.peersDb = this.ourDb.child('peers');
  }
  fetch() {
    this.peersDb.once('value', async(snap => {
      this.setPeers(Object.keys(snap.val()));
    }));
  }
  setPeers(peers) {
    this.peers = peers;
    this.onpeerschanged();
  }
  onpeerschanged() {
  }
  add(peer) {
    if (!this.peers.includes(peer)) {
      this.peers.push(peer);
      this.peersDb.child(peer).set(true);
    }
  }
};

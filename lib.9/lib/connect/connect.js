/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {makeId} from './utils.js';
import {database} from '../../../firebase.js';

const dbroot = database.ref(`webarcs/v0/`);
const channels = dbroot.child('channels');
const rendezvous = dbroot.child('rendezvous');

// used to wrap FB callbacks so we can get off the FB call stack (for debugging)
const async = task => {
  return async (...args) => {
    await Promise.resolve();
    task(...args);
  };
};

export const Actor = class {
  constructor(id) {
    this.channels = {};
    this.id = id;
    this.sessionId = makeId();
    this.listen();
  }
  listen() {
    rendezvous.child(this.id).on('child_added', async(snap => {
      const peer = snap.key;
      const remoteSessionId = snap.val();
      snap.ref.remove();
      console.log(`Actor[${this.id}]: ring from [${peer}] on channel [${remoteSessionId}]`);
      let ch = this.channels[peer];
      if (ch) {
        if (ch.peer === remoteSessionId) {
          // already connected; must get here or we will ring each other forever
          return;
        }
        console.log(`Actor[${this.id}]: closing channel to [${ch.peer}]`);
        ch.close();
      }
      ch = this.open(remoteSessionId);
      ch.onreceive = msg => {
        this.onreceive(peer, msg);
      };
      this.channels[peer] = ch;
      this.onchannel(peer, ch);
      // invite remote to connect to us
      this.ring(peer);
    }));
  }
  ring(peer) {
    rendezvous.child(peer).child(this.id).set(this.sessionId);
  }
  open(remoteSessionId) {
    console.log(`Actor[${this.id}]: opening a channel to [${remoteSessionId}] from [${this.sessionId}]`);
    return new Channel(this.sessionId, remoteSessionId);
  }
  send(peer, msg) {
    const ch = this.channels[peer];
    if (ch) {
      ch.send(msg);
    } else {
      console.error(`no channel for [${peer}]`);
    }
  }
  onchannel(peer, channel) {
  }
};

export const Channel = class {
  constructor(id, peer) {
    this.id = id;
    this.peer = peer;
    this.open();
  }
  open() {
    this.theirs = channels.child(this.peer).child(this.id);
    //this.theirs.remove();
    const listener = this.theirs.on('child_added', async(snap => {
      const msg = JSON.parse(snap.val());
      console.log(`received from [${this.peer}]:`, msg);
      snap.ref.remove();
      this.onreceive(msg);
    }));
    this.off = () => this.theirs.off('child_added', listener);
    this.ours = channels.child(this.id).child(this.peer);
  }
  close() {
    this.off();
    this.ours.remove();
    this.theirs.remove();
  }
  send(msg) {
    console.log(`sending to [${this.peer}]:`, msg);
    this.ours.push(JSON.stringify(msg));
  }
  onreceive(msg) {
  }
};

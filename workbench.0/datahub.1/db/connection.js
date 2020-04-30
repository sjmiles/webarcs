/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Automerge} from '../../automerge.js';
import {Store} from './store.js';

const log = false;

export class Connection {
  constructor(id, database) {
    this.id = id;
    this.msgSink = [];
    this.database = database;
    database.docSet.registerHandler((id, doc) => this.onchange(id, doc));
    this.connection = new Automerge.Connection(database.docSet, msg => this.send(msg));
    this.connection.id = id;
  }
  open() {
    log && console.log(`Connection(${this.id})::open`);
    this.connection.open();
    this.isOpen = true;
  }
  close() {
    this.isOpen = false;
    this.connection.close();
  }
  send(msg) {
    if (this.reSharedStore(msg)) {
      log && console.groupCollapsed(`Send::Connection(${this.id})`, msg);
      // TODO(sjmiles): simulate asynchrony of a real communication channel
      setTimeout(() => this.onsend(msg), 0);
      log && console.groupEnd();
    }
  }
  receive(msg) {
    log && console.groupCollapsed(`Receive::Connection(${this.id})`, msg);
    this.connection.receiveMsg(msg);
    this.database.fixup(msg.docId);
    log && console.groupEnd();
  }
  reSharedStore(msg) {
    //console.log('meta', Store.meta(msg.docId));
    return Store.meta(msg.docId).tags.includes('shared');
  }
  onchange(id, doc) {
    // too noisy
    //Store.log(`Connection(${this.id}):Store(${id}): `, doc);
  }
  onsend(msg) {
    log && console.log(msg);
  }
  connect(endpoint) {
    this.onsend = msg => {
      // TODO(sjmiles): too sneaky? could pile up messages in closures
      // waiting for endpoint to be open
      const send = () => {
        if (endpoint.isOpen) {
          endpoint.receive(msg);
        } else {
          setTimeout(send, 100);
        }
      };
      send();
    };
    this.open();
  }
}

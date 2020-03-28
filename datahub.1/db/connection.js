/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//import {Store} from '../db/store.js';
import {Automerge} from '../../automerge.js';

export class Connection {
  constructor(id, database) {
    this.id = id;
    this.msgSink = [];
    this.database = database;
    const {docSet} = database
    docSet.registerHandler((id, doc) => this.onchange(id, doc));
    this.connection = new Automerge.Connection(docSet, msg => this.send(msg));
    this.connection.id = id;
  }
  open() {
    console.log(`Connection(${this.id})::open`);
    this.connection.open();
    this.isOpen = true;
  }
  close() {
    this.isOpen = false;
    this.connection.close();
  }
  send(msg) {
    console.group(`Connection(${this.id})::send`, msg);
    // TODO(sjmiles): simulate asynchrony of a real communication channel
    setTimeout(() => this.onsend(msg), 0);
    //this.onsend(msg);
    console.groupEnd();
  }
  receive(msg) {
    console.group(`Connection(${this.id})::receive`, msg);
    this.connection.receiveMsg(msg);
    this.database.fixup(msg.docId);
    console.groupEnd();
  }
  // send(msg) {
  //   console.group(`Connection(${this.id})::send`, msg);
  //   this.sending = true;
  //   try {
  //     this.onsend(msg);
  //   } finally {
  //     this.sending = false;
  //     this.handlePendingMsgs();
  //   }
  //   console.groupEnd();
  // }
  // receive(msg) {
  //   if (this.sending) {
  //     console.warn(`Connection(${this.id})::deferring received msg`, msg);
  //     this.msgSink.push(msg);
  //   } else {
  //     this.handleMsg(msg);
  //   }
  // }
  // handlePendingMsgs() {
  //   const pending = this.msgSink;
  //   if (pending.length) {
  //     this.msgSink = [];
  //     console.log(`Connection(${this.id})::handling [${pending.length}] deferred messages`);
  //     pending.forEach(msg => this.handleMsg(msg));
  //   }
  // }
  // handleMsg(msg) {
  //   console.group(`Connection(${this.id})::receive`, msg);
  //   this.connection.receiveMsg(msg);
  //   this.database.fixup(msg.docId);
  //   console.groupEnd();
  // }
  onchange(id, doc) {
    //Store.log(`Connection(${this.id}):Store(${id}): `, doc);
  }
  onsend(msg) {
    console.log(msg);
  }
  connect(endpoint) {
    this.onsend = msg => {
      const send = () => {
        if (endpoint.isOpen) {
          console.log(`Connection(${this.id})::executing send...`, msg);
          endpoint.receive(msg);
        } else {
          console.log(`Connection(${this.id})::deferring send...`, msg);
          setTimeout(send, 100);
        }
      };
      send();
    };
    this.open();
  }
};

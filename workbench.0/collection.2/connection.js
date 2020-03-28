/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './database.js';
import {Automerge} from '../automerge.js';

export class Connection {
  constructor(id, database) {
    this.id = id;
    this.db = database;
    this.docSet = database.docSet;
    this.docSet.registerHandler((id, doc) => this.onchange(id, doc));
    this.connect = new Automerge.Connection(this.docSet, msg => this.send(msg));
    this.connect.id = id;
  }
  open() {
    this.isOpen = true;
    this.connect.open();
  }
  close() {
    this.isOpen = false;
    this.connect.close();
  }
  send(msg) {
    console.log(`Connection(${this.id})::send`, msg);
    this.onsend(msg);
  }
  receive(msg) {
    console.log(`Connection(${this.id})::receive`, msg);
    this.connect.receiveMsg(msg);
    this.db.fixup(msg.docId);
  }
  onchange(id, doc) {
    Store.log(`Connection(${this.id}):Store(${id}): `, doc);
  }
  onsend(msg) {
    console.log(msg);
  }
};

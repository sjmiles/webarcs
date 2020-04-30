/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Database} from './database.js';
// import {Store} from './core/store.js';
// import {Persona} from './core/persona.js';
const {Automerge} = window;

export class Connection {
  constructor(device, remote) {
    this.device = device;
    this.remote = remote;
    this.db = new Database();
    device.populatePeerDb(this.db, remote);
  }
  dump() {
    const data = this.db.serializable();
    const info = Object.keys(data).map(key => `
<b>STORE</b>: ${key}
${JSON.stringify(data[key], null, '  ')}
    `).join('');
    return `
      <b>"${this.device.id}" to share with "${this.remote.id}":</b><br>
      <pre>${info ? info : '(no stores)'}</pre>
    `;
  }
  connect(endpoint) {
    const sender = this.createSender(endpoint);
    this.conn = new Automerge.Connection(this.db.truth, sender);
    this.conn.open();
    this.open = true;
  }
  createSender(endpoint) {
    let pending = [];
    const handlePending = () => {
      if (endpoint.open && pending) {
        clearInterval(interval);
        pending.forEach(msg => endpoint.receive(msg));
        pending = null;
        //console.warn(`${this.device.id}: flushing pending messages`, pending);
      }
    };
    const interval = setInterval(handlePending, 500);
    return msg => {
      if (!endpoint.open) {
        //console.warn(`${this.device.id}: pushing message`);
        pending.push(msg);
      } else {
        handlePending();
        //console.warn(`${this.device.id}: sending message`);
        endpoint.receive(msg);
      }
    };
  }
  send(msg) {
    alert(msg);
  }
  receive(msg) {
    this.conn.receiveMsg(msg);
  }
}


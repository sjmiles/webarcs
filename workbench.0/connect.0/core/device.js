
/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// import {Database} from './core/database.js';
import {Store} from './store.js';
// import {Persona} from './core/persona.js';

export class LocalPersistor {
  static persist(id, item) {
    localStorage.setItem(id, item);
  }
  static restore(id) {
    return localStorage.getItem(id);
  }
}

export class Device {
  constructor(id, persona) {
    this.id = id;
    this.persona = persona;
    this.peers = new Store('peers');
  }
  persist() {
    LocalPersistor.persist(`${this.id}:peers`, this.peers.json());
  }
  restore() {
    const peers = LocalPersistor.restore(`${this.id}:peers`);
    this.peers.change(doc => {
      Object.keys(peers).forEach(key => doc[key] = peers[key]);
    });
  }
  populatePeerDb(database, peer) {
    if (peer.id === this.persona.id) {
      database.add(this.peers);
    }
    this.persona.populatePeerDb(database, peer);
  }
}

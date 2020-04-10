
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
import {Store} from './store.js';

export class Persona {
  constructor(id) {
    this.id = id;
    this.arcs = new Database(`${id}:arcs`);
    this.stores = new Database(`${id}:stores`);
    //this.sporks = new Store('sporks');
  }
  populatePeerDb(database, peer) {
    //database.add(this.sporks);
    // for each arc
    this.arcs.storeIds.forEach(id => {
      const arc = this.arcs.get(id);
      // if the arc is owned by the target Persona, or is shared with the target Persona,
      // share the arc-metadata
      if (this.id === peer.id || arc.truth.shares.includes(peer.id)) {
        database.add(arc);
        // include each arc store
        arc.truth.stores.forEach(id => database.add(this.stores.get(id)));
      }
    });
  }
}

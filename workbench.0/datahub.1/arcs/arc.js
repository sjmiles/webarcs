/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from '../db/store.js';

export class Arc {
  constructor(id, env, composer) {
    this.meta = {};
    this.stores = {};
    this.id = id;
    this.env = env;
    this.composer = composer;
  }
  changed() {
    this.onchange();
  }
  onchange() {
  }
  // stores we create (?)
  requireStore(name) {
    const id = this.makeStoreId(name);
    this.addStore(name, id);
    return id;
  }
  // stores we reference (?)
  requireStoreById(id) {
    this.addStore(id, id);
    return id;
  }
  addStore(name, id) {
    if (!this.stores[name]) {
      this.stores[name] = this.env.database.require(id);
      this.env.database.observe(id, () => this.onchange());
    }
  }
  makeStoreId(name) {
    return `${this.id}:store=${name}`;
  }
  getStore(name) {
    const id = this.requireStore(name);
    return new Store(this.env.database, id);
  }
}

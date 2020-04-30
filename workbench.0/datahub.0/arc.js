/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
export class Arc {
  constructor(id, env, composer) {
    this.stores = {};
    this.id = id;
    this.env = env;
    this.composer = composer;
    this.requireStore('persistent', ['persist']);
  }
  changed() {
    this.onchange();
  }
  onchange() {
  }
  requireStore(name, tags) {
    this.stores[name] = this.env.database.require(this.makeStoreId(name), tags);
  }
  makeStoreId(name) {
    return `${this.id}:store(${name})`;
  }
};


/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {AbstractStore} from './abstract-store.js';
const {Automerge} = window;

export class Database extends AbstractStore {
  constructor(id) {
    super(id);
    this.stores = {};
    this.truth = new Automerge.DocSet();
  }
  get storeIds() {
    return [...this.truth.docIds];
  }
  get data() {
    return this.truth.docs;
  }
  get(id) {
    return this.stores[id];
  }
  add(store) {
    this._referenceStore(store);
    this._listen(store);
  }
  _referenceStore(store) {
    this.stores[store.id] = store;
    this.truth.setDoc(store.id, store.truth);
  }
  _listen(store) {
    if (!this.listeners[store.id]) {
      this.listeners[store.id] = store.listen('truth-change', () => {
        this._refStore(store);
      });
    }
  }
  remove(store) {
    delete this.stores[store.id];
    const listener = this.listeners[store.id];
    if (listener) {
      delete this.listeners[store.id];
      store.unlisten(listener);
    }
  }
}

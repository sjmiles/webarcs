
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
import {Store} from './store.js';
import {Automerge} from './automerge.js';
import {logFactory} from '../utils/log.js';

const log = logFactory(logFactory.flags['database'] || logFactory.flags['all'], 'database', 'navy');

export class Database extends AbstractStore {
  stores;
  storeListeners;
  ownerId;
  constructor(id) {
    super(id);
    this.stores = {};
    this.storeListeners = {};
    this.truth = new Automerge.DocSet();
    this.truth.registerHandler(this.onDocsChanged.bind(this));
  }
  onDocsChanged(docId, doc) {
    const store = this.get(docId);
    if (store) {
      //log.warn(`[${this.id}]: onDocsChanged(${docId}): new truth? ${store.truth === doc}`);
      store.truth = doc;
    } else {
      //log.warn(`[${this.id}]: onDocsChanged(${docId}): adding missing store`);
      this.add(new Store(this.ownerId, docId));
    }
    log(`[${this.id}]: onDocsChanged(${docId})`);
    this.fire('doc-changed', docId);
  }
  get docs() {
    return this.truth.docs;
  }
  get storeIds() {
    return [...this.truth.docIds];
  }
  get data() {
    return this.docs;
  }
  get storesArray() {
    return Object.values(this.stores);
  }
  forEachStore(iter) {
    return this.storesArray.map(iter);
  }
  get(id) {
    return this.stores[id];
  }
  add(store) {
    if (!this.stores[store.id]) {
      this._referenceStore(store);
      this._listenStore(store);
    }
  }
  _referenceStore(store) {
    this.stores[store.id] = store;
    this.truth.setDoc(store.id, store.truth);
  }
  _listenStore(store) {
    if (!this.storeListeners[store.id]) {
      //console.log(`[${this.id}]: listening for set-truth on [${store.id}]`);
      this.storeListeners[store.id] = store.listen('set-truth', () => {
        log(`[${store.id}]: set-truth, updating [${this.id}]`);
        this._referenceStore(store);
      });
    }
  }
  remove(store) {
    delete this.stores[store.id];
    const listener = this.storeListeners[store.id];
    if (listener) {
      delete this.storeListeners[store.id];
      store.unlisten(listener);
    }
  }
  dump() {
    return this.forEachStore(s =>
      `<b style="font-size:125%;${
        s.shared ? 'color:green;' : ''}">${
        s.id}${
        s.shared ? ' (shared)' : ''}</b>\n${
        s.json}`
    ).join('\n\n');
//     const data = this.pojo.docs;
//     return Object.keys(data).map(key => `${key}
// ${JSON.stringify(data[key], null, '  ')}
// `).join('\n');
  }
}

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
import {makeId} from '../utils.js';
import {Store} from './store.js';

export class Database {
  constructor(id) {
    this.id = id;
    this.docSet = new Automerge.DocSet();
    this.docSet.registerHandler((id, doc) => this.onchange(id, doc));
  }
  onchange(id, doc) {
  }
  require(id) {
    return this.get(id) || this.create(id);
  }
  get storeIds() {
    return [...this.docSet.docIds];
  }
  create(id) {
    id = id || makeId();
    // TODO(sjmiles): A virginal doc fails to trigger connection.maybeSend (it's clock is 0), causing this database
    // to fail the connection handshake. Adding `dumb: true` field advances doc's clock beyond 0.
    //this.set(id, Automerge.init());
    this.set(id, Automerge.from({dumb: true}));
    return this.get(id);
  }
  get(id) {
    return this.docSet.getDoc(id);
  }
  set(id, doc) {
    return this.docSet.setDoc(id, doc);
  }
  change(id, mutator) {
    let store = this.get(id);
    if (!store) {
      throw `Database::change: bad store id [${id}]`;
    }
    store = Automerge.change(store, mutator);
    this.set(id, store);
  }
  fixup(docId) {
    // the doc that was potentially modified
    let truth = this.docSet.getDoc(docId);
    if (truth) {
      // do our conflict fix-up
      this.docSet.setDoc(docId, Store.fix(truth));
    }
  }
  observe(id, observer) {
    this.docSet.registerHandler((docId, doc) => {
      if (id === docId) {
        observer();
      }
    });
  }
  // PersistentDatabase subclass?
  persist() {
    const ids = this.storeIds;
    localStorage.setItem(this.id, JSON.stringify(ids));
    ids.forEach(id => this.persistStore(id));
  }
  persistStore(id) {
    const qualifiedId = `${this.id}:${id}`;
    localStorage.setItem(qualifiedId, JSON.stringify(this.get(id)));
  }
  restore() {
    const ids = JSON.parse(localStorage.getItem(this.id));
    if (ids) {
      ids.forEach(id => this.restoreStore(id));
    }
  }
  restoreStore(id) {
    this.create(id);
    const qualifiedId = `${this.id}:${id}`;
    const value = JSON.parse(localStorage.getItem(qualifiedId));
    console.log(this.id, id, value);
    if (value) {
      this.change(id, data => {
        Object.keys(value).forEach(key => data[key] = value[key]);
      });
    }
  }
};

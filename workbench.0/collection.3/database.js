/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {makeId} from './utils.js';
import {Automerge} from '../automerge.js';

export class Store {
  static log(preamble, truth) {
    console.log(`${preamble||''}${JSON.stringify(truth, null, '  ')}`);
  }
  static fix(doc) {
    Object.keys(doc).forEach(key => {
      const conflicts = Automerge.getConflicts(doc, key);
      Automerge.clearConflicts(doc, key);
      if (conflicts) {
        const value = Object.values(conflicts)[0];
        if (Array.isArray(value)) {
          console.log(`array conflict for [${key}]`, value, conflicts);
          doc = Automerge.change(doc, root => value.forEach(v => root[key].push(v)));
        } else if (typeof value === 'object') {
          console.log(`object conflict for [${key}]`, value, conflicts);
          doc = Automerge.change(doc, root => {
            const entity = root[key];
            Object.keys(value).forEach(id => entity[id] = {...value[id]});
          });
        }
      }
    });
    return doc;
  }
};

export class Database {
  constructor(id) {
    this.id = id;
    this.docSet = new Automerge.DocSet();
    this.docSet.registerHandler((id, doc) => this.onchange(id, doc));
  }
  onchange(id, doc) {
  }
  fixup(docId) {
    // the doc that was potentially modified
    let truth = this.docSet.getDoc(docId);
    if (truth) {
      // do our conflict fix-up
      this.docSet.setDoc(docId, Store.fix(truth));
    }
  }
  create(id) {
    id = id || makeId();
    this.set(id, Automerge.init());
    return id;
  }
  get(id) {
    return this.docSet.getDoc(id);
  }
  set(id, doc) {
    return this.docSet.setDoc(id, doc);
  }
  change(id, mutator) {
    let store = this.get(id);
    store = Automerge.change(store, mutator);
    this.set(id, store);
  }
};

export class Collection {
  constructor(data, name) {
    if (!data[name]) {
      data[name] = {};
    }
    this.data = data[name];
  }
  add(item) {
    this.data[makeId()] = item;
  }
}

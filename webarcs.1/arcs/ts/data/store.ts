/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {deepEqual, deepUndefinedToNull} from '../utils/object.js';
import {AbstractStore} from './abstract-store.js';
const {Automerge} = window as any;

export class Store extends AbstractStore {
  name;
  shared: boolean;
  volatile: boolean;
  ownerId;
  constructor(ownerId, id, truth?) {
    super(id);
    // TODO(sjmiles): to uniquify persistence keys
    this.ownerId = ownerId;
    this.truth = truth || Automerge.init();
  }
  get json() {
    return this.toJson(true);
  }
  get pojo() {
    return JSON.parse(this.toJson(false));
  }
  toJson(pretty?) {
    return JSON.stringify(this.truth, null, pretty ? '  ' : '');
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
    this.persist();
    return this;
  }
  load(serial) {
    if (serial) {
      this.truth = Automerge.load(serial);
    }
  }
  save() {
    return Automerge.save(this.truth);
  }
  dump() {
    return `${this.id}: ${this.json}`;
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
  hasChanges(outputs) {
    const data = this.truth;
    // if (typeof outputs !== 'object') {
    //   return data !== outputs;
    // }
    const changed = Object.keys(outputs).some(key => {
      const truth = data[key];
      let value = outputs[key];
      // TODO(sjmiles): potentially expensive dirty-checking here
      if (deepEqual(truth, value)) {
        return false;
      }
      // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
      deepUndefinedToNull(value);
      return true;
    });
    return changed;
  }
  // mergeRawData(outputs) {
  //   let changed = false;
  //   this.change(doc => {
  //     Object.keys(outputs).forEach(key => {
  //       const truth = doc[key];
  //       let value = outputs[key];
  //       // TODO(sjmiles): perform potentially expensive dirty-checking here
  //       if (deepEqual(truth, value)) {
  //         return;
  //       }
  //       // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
  //       if (value === undefined) {
  //         value = null;
  //       }
  //       else {
  //         // TODO(sjmiles): stopgap: deeply convert undefined values to null
  //         deepUndefinedToNull(value);
  //       }
  //       doc[key] = value;
  //       changed = true;
  //     });
  //   });
  //   return changed;
  // }
  // TODO(sjmiles): delegate this work to a persistor object
  get persistId() {
    return `[${this.ownerId}]:${this.id}`;
  }
  persist() {
    if (!this.volatile) {
      const serial = this.save();
      localStorage.setItem(this.persistId, serial);
    }
  }
  restore() {
    if (!this.volatile) {
      const serial = localStorage.getItem(this.persistId);
      if (serial) {
        this.load(serial);
        return true;
      }
    }
    return false;
  }
}


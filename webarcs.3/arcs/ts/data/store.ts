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
import {logFactory} from '../utils/log.js';
import {Automerge} from './automerge.js';
import {AbstractStore} from './abstract-store.js';

const log = logFactory(true, 'store', 'orange');

// These CRDT documents will grow unbounded forever always waiting for a participant
// to reappear with changes from the distant past.
//
// Can we define a notion of 'distant', prune the histories, and use another strategy when
// said participant reappears?

export class Store extends AbstractStore {
  name;
  ownerId;
  type;
  tags;
  constructor(ownerId, id: string, truth?) {
    super(id);
    // TODO(sjmiles): to uniquify persistence keys
    this.ownerId = ownerId;
    // name of data object in document (should we just make this 'data'?)
    this.name = this.getMeta().name;
    if (!truth) {
      truth = Automerge.init();
    }
    this.truth = truth;
  }
  // [arcid]:store:[name]:[type]:[tags]:[tenantid]
  static idFromMeta({arcid, name, type, tags, tenantid}) {
    return `${arcid}:store:${name}:${type}:${tags.join(',')}:${tenantid}`;
  }
  static metaFromId(id) {
    const [arcid, _, name, type, tags, tenant, device] = id.split(':');
    return {arcid, name, type: type || 'any', tags: tags || [], tenantid: `${tenant}:${device}`};
  }
  getMeta() {
    return Store.metaFromId(this.id);
  }
  get meta() {
    return this.getMeta();
  }
  getProperty() {
    return this.truth.data;
    //return this.truth[this.getMeta().name];
  }
  isCollection() {
    return this.getMeta().type[0] === '[';
  }
  // TODO(sjmiles): `tags` usage feels brittle, not sure it's the right way to go
  isShared() {
    return !this.getMeta().tags.includes('private');
  }
  isVolatile() {
    return this.getMeta().tags.includes('volatile');
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
        } else if (typeof value === 'object') { //} && !key.includes('$arcs')) {
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
  // TODO(sjmiles): delegate this work to a persistor object
  get persistId() {
    return `[${this.ownerId}]:${this.id}`;
  }
  persist() {
    return;
    if (!this.isVolatile()) {
      const serial = this.save();
      localStorage.setItem(this.persistId, serial);
    }
  }
  restore() {
    if (!this.isVolatile()) {
      const serial = localStorage.getItem(this.persistId);
      if (serial) {
        this.load(serial);
        return true;
      }
    }
    return false;
  }
}

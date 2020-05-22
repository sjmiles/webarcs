/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {deepCopy, deepEqual, deepUndefinedToNull} from '../utils/object.js';
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
  static enablePersistance: boolean;
  name;
  ownerId;
  ready;
  constructor(ownerId, id: string, truth?) {
    super(id);
    // TODO(sjmiles): ad hoc persistence control: I moved 'this.persist()' to 'changed' method,
    // which is invoked whenever truth is set. 
    this.ready = false;
    // TODO(sjmiles): only here to uniquify persistence keys
    this.ownerId = ownerId;
    // name of data object in document (should we just make this 'data'?)
    this.name = this.meta.name;
    if (!truth) {
      truth = Automerge.init();
    }
    // avoid the set-trap
    this._truth = truth;
  }
  // [arcid]:store:[name]:[type]:[tags]:[persona]
  static idFromMeta({arcid, name, type, tags, tenantid}) {
    const persona = tenantid.split(':').shift();
    return `${arcid}:store:${name}:${type}:${tags.join(',')}:${persona}`;
  }
  static metaFromId(id) {
    const [arcid, _, name, type, tags, persona] = id.split(':');
    return {arcid, name, type: type || 'any', tags: tags || [], persona};
  }
  get meta() {
    return Store.metaFromId(this.id);
  }
  get tags() {
    return this.meta.tags;
  }
  get data() {
    return this.truth.data;
  }
  getProperty() {
    return this.truth.data;
    //return this.truth[this.meta.name];
  }
  isCollection() {
    return this.meta.type[0] === '[';
  }
  get length() {
    const data = this.getProperty();
    return data ? Object.values(data).length : 0;
  }
  // TODO(sjmiles): `tags` usage feels brittle, not sure it's the right way to go
  // private: don't share this store, full stop
  isPrivate() {
    return this.tags.includes('private');
  }
  // private: share this store willy nilly
  isPublic() {
    return this.tags.includes('public');
  }
  // deprecated: now all stores personal unless volatile
  // personal: share this store with other tenants of my Persona
  // isPersonal() {
  //   return this.tags.includes('personal');
  // }
  // personal: store has been shared with an arc
  isShared() {
    return this.tags.includes('shared');
  }
  // volatile: do not persist the arc data
  isVolatile() {
    return this.tags.includes('volatile');
  }
  changed() {
    this.persist();
    super.changed();
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
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
    // const old = doc;
    // console.log('before fix:', JSON.stringify(doc));
    Object.keys(doc).forEach(key => {
      const conflicts = Automerge.getConflicts(doc, key);
      Automerge.clearConflicts(doc, key);
      if (conflicts) {
        const value = Object.values(conflicts)[0];
        if (!value) {
          // weird null conflict value?
        }
        else if (Array.isArray(value)) {
          //log(`array conflict for [${key}]`, value, conflicts);
          log(`automerge create-op conflict detected: Array may not be supported!`);
          doc = Automerge.change(doc, root => value.forEach(v => root[key].push(v)));
        }
        else if (typeof value === 'object') { //} && !key.includes('$arcs')) {
          //log(`object conflict for [${key}]`, value, conflicts);
          log(`automerge create-op conflict detected: applying fix`); //, JSON.stringify(value));
          doc = Automerge.change(doc, root => {
            let entity = root[key];
            if (!entity) {
              entity = root[key] = {};
            }
            Object.keys(value).forEach(id => {
              let datum = value[id];
              if (typeof datum === 'object') {
                // copy plain data out of any CRDT controlled sub-objects
                entity[id] = deepCopy(datum) //{...datum}
              } else {
                // copy concrete data directly
                entity[id] = datum;
              }
            });
          });
        }
      }
    });
    // if (old !== doc) {
    //   console.log('after fix:', JSON.stringify(doc));
    // }
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
    if (Store.enablePersistance) {
      if (!this.isVolatile()) {
        const serial = this.save();
        localStorage.setItem(this.persistId, serial);
        log(`${this.persistId}: persisted`, this.pojo.data);
      }
    }
  }
  restore() {
    if (!this.isVolatile()) {
      const serial = localStorage.getItem(this.persistId);
      if (serial) {
        this.load(serial);
        log(`${this.persistId}: restored`, this.pojo.data);
        return true;
      }
    }
    return false;
  }
}


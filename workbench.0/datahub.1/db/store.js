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

export class Store {
  static log(preamble, truth) {
    console.log(`${preamble||''} = ${JSON.stringify(truth, null, '  ')}`);
  }
  static serialize(data) {
    return data ? JSON.parse(JSON.stringify(data)) : data;
  }
  static json(truth) {
    return JSON.stringify(truth, null, '  ');
  }
  static fix(doc) {
    Object.keys(doc).forEach(key => {
      const conflicts = Automerge.getConflicts(doc, key);
      Automerge.clearConflicts(doc, key);
      if (conflicts) {
        const value = Object.values(conflicts)[0];
        if (Array.isArray(value)) {
          //console.log(`array conflict for [${key}]`, value, conflicts);
          doc = Automerge.change(doc, root => value.forEach(v => root[key].push(v)));
        } else if (typeof value === 'object') {
          //console.log(`object conflict for [${key}]`, value, conflicts);
          doc = Automerge.change(doc, root => {
            const entity = root[key];
            Object.keys(value).forEach(id => entity[id] = {...value[id]});
          });
        }
      }
    });
    return doc;
  }
  static meta(id) {
    const parts = id.split(':');
    return {
      arcId: parts[0],
      storeName: parts[1],
      tags: parts[2].split(','),
      type: parts[3]
    };
  }
  constructor(database, id) {
    this.database = database;
    this.id = id;
  }
  get data() {
    return this.database.get(this.id);
  }
  set data(data) {
    this.database.set(this.id, data);
  }
  serialize(prop) {
    return Store.serialize(this.data[prop]);
  }
  change(mutator) {
    return this.database.change(this.id, mutator);
  }
}

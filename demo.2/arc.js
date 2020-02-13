/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Composer} from './composer.js';
import {Data} from './data.js';
import {Host} from './host.js';
import {makeId, shallowMerge} from './utils.js';

export class Store extends Data {
  constructor(id) {
    super();
    this.id = id;
  }
  synchronize(stores) {
    let truth;
    do {
      // extracting changes is destructive
      stores.forEach(store => this.apply(store.changes));
      // extracting changes is destructive
      truth = this.changes;
      if (truth.length) {
        stores.forEach(store => store.apply(truth));
      }
    } while (truth.length);
    console.log('SYNCHRONIZED');
  }
}

export class Arc extends Data {
  constructor(root, storage) {
    super();
    this.composer = new Composer(root);
    this.storage = storage || new Store();
    this.hosts = [];
    this.id = makeId();
    this.merge(this.storage.truth);
  }
  get truth() {
    return super.truth;
  }
  set truth(truth) {
    super.truth = truth;
    // truth changes trigger update
    this.update();
  }
  update() {
    this.hosts.forEach(h => this.updateHost(h));
  }
  updateHost(host) {
    const outputs = host.update(this.truth);
    if (outputs && typeof outputs === 'object') {
      this.maybeChange(doc => shallowMerge(doc, outputs));
    }
  }
  async addParticle(kind, container) {
    const host = await Host.createHostedParticle(kind, container, this.composer);
    this.hosts.push(host);
    this.updateHost(host);
  }
  hostById(id) {
    return this.hosts.find(h => h.id === id);
  }
}

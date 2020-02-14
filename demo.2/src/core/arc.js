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

export class Arc extends Data {
  constructor({name, root}) {
    super();
    this.hosts = [];
    this.name = name;
    this.id = `arc(${name}:${makeId()})`;
    this.composer = new Composer(root);
  }
  get truth() {
    return super.truth;
  }
  set truth(truth) {
    super.truth = truth;
    // truth changes trigger update
    //this.update();
    this.dirty = true;
  }
  async update() {
    if (this.updating) {
      this.dirty = true;
    } else {
      //console.group(`${this.id}: updating`);
      this.updating = true;
      try {
        do {
          this.dirty = false;
          const truth = this.truth;
          for (var i=0, host; (host=this.hosts[i]); i++) {
            await this.updateHost(host, truth);
          }
          //await Promise.all(this.hosts.map(h => this.updateHost(h, truth)));
        } while (this.dirty);
      }
      finally {
        this.updating = false;
        //console.groupEnd();
      }
      this.changed();
    }
  }
  changed() {
    if (this.onchange) {
      this.onchange(this);
    }
  }
  async updateHost(host, truth) {
    //console.group(`updateHost::${host.id}:`);
    const outputs = await host.update(truth);
    if (outputs && typeof outputs === 'object') {
      this.maybeChange(doc => shallowMerge(doc, outputs));
    }
    //console.groupEnd();
    console.log(`updateHost::${host.id}: done`);
  }
  async addParticle(kind, container) {
    const id = `${this.name || this.id}:${kind}(${makeId()})`;
    const host = await Host.createHostedParticle(id, kind, kind, container, this.composer);
    this.hosts.push(host);
    this.updateHost(host, this.truth);
  }
  hostById(id) {
    return this.hosts.find(h => h.id === id);
  }
}

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
  log(msg) {
    console.log(`${this.id}::${msg}`);
  }
  // responsibility: hosts/particles
  async addParticle(kind, container) {
    const id = `${this.name || this.id}:${kind}(${makeId()})`;
    const host = await Host.createHostedParticle(id, kind, kind, container, this.composer);
    host.onoutput = outputs => this.receiveHostOutput(host, outputs);
    this.hosts.push(host);
    this.updateHost(host, this.truth);
  }
  hostById(id) {
    return this.hosts.find(h => h.id === id);
  }
  // responsibility: truth
  get truth() {
    return super.truth;
  }
  set truth(truth) {
    this.log('setting truth');
    super.truth = truth;
    if (this.peekChanges().length) {
      this.update();
    } else {
      console.warn('skipped updating on empty changes!');
    }
  }
  // responsibility: synchronize truth with hosts
  update() {
    this.updateHosts(this.truth);
    this.changed();
  }
  updateHosts(truth) {
    this.hosts.forEach(h => this.updateHost(h, truth));
  }
  updateHost(host, truth) {
    console.log(`${this.id}::updateHost(${host.id})`);
    host.update(truth);
  }
  // notify listener that we have changed
  changed() {
    if (this.onchange) {
      this.onchange(this);
    }
  }
  receiveHostOutput(host, outputs) {
    console.log(`receiveHostOutput::${host.id}`, outputs);
    if (outputs && typeof outputs === 'object') {
      this.maybeChange(doc => shallowMerge(doc, outputs));
    }
  }
}

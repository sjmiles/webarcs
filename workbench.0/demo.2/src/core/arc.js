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
    this.name = name || '';
    this.id = `arc:${name}:${makeId()}`;
    this.composer = new Composer(root);
  }
  log(msg) {
    console.log(`${this.id}::${msg}`);
  }
  // responsibility: particles
  async addParticle(kind, container) {
    const id = `${this.id}:${kind}(${makeId()})`;
    const onoutput = (host, outputs) => this.receiveHostOutput(host, outputs);
    const host = await Host.createHostedParticle(id, kind, kind, container, this.composer, onoutput);
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
    //this.log('setting truth');
    //const last = this.truth;
    //super.truth = truth;
    //if (this.peekChanges(this.truth, truth).length) {
    if (JSON.stringify(this.truth) !== JSON.stringify(truth)) {
    //if (this.peekChanges(this.old, truth).length) {
      console.log(`${this.id}: truth changed, performing update`);
      super.truth = truth;
      this.update();
    } else {
      //console.warn('skipped updating on empty changes!');
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
  // change notifier
  changed() {
    if (this.onchange) {
      this.onchange(this);
    }
  }
  receiveHostOutput(host, outputs) {
    console.log(`receiveHostOutput::${host.id}`, Object.keys(outputs));
    if (outputs && typeof outputs === 'object') {
      if (this.maybeChange(doc => shallowMerge(doc, outputs))) {
        //this.changed();
      }
    }
  }
}

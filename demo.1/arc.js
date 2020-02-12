/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../xen/xen-async.js';
import {Particle} from './particle.js';
import {Composer} from './composer.js';
import {Data} from './data.js';

export const makeId = () => {
  const irand = (range) => Math.floor(Math.random()*range);
  return `${irand(1e2)+1e1}-${irand(1e2)+1e1}`;
  //return `${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}-${irand(1e4)+1e3}`;
}

// TODO(sjmiles): principle: Particles remain stupid, system integration happens in an owner (Host)

export class Host {
  constructor(name, container, particle, composer) {
    this.id = makeId();
    this.name = name;
    this.container = container;
    this.particle = particle;
    this.composer = composer;
  }
  update(inputs) {
    const outputs = this.particleUpdate(inputs);
    this.render(inputs);
    return outputs;
  }
  render(inputs) {
    this.debounce = Xen.debounce(this.debounce, () => this.renderModel(inputs), 100);
  }
  renderModel(inputs) {
    //console.log(`Host::renderModel(${particle.name}::${particle.id})`);
    const {id, name, container} = this;
    const {template, state} = this.particle;
    const model = this.particleRender(inputs);
    this.composer.render({id, name, container, content: {template, model}});
  }
  // isolating 'things particle can do'
  particleUpdate(inputs) {
    return this.particle.update(inputs);
  }
  particleRender(inputs) {
    return this.particle.render(inputs);
  }
}

export class Store extends Data {
  constructor(id) {
    super();
    this.id = id;
  }
  synchronize(stores) {
    stores.forEach(store => this.apply(store.changes));
    // extracting changes is destructive
    const truth = this.changes;
    stores.forEach(store => store.apply(truth));
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
    host.update(this.truth);
  }
  addParticle(name, container, kind) {
    const kindClass = Particle.registry[kind];
    if (kindClass) {
      const host = new Host(name, container, new kindClass(), this.composer);
      this.hosts.push(host);
      this.updateHost(host);
    }
  }
}

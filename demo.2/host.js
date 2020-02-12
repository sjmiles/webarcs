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
import {makeId, shallowMerge} from './utils.js';
import {Hub} from './hub.js';

// TODO(sjmiles): principle: Particles remain stupid, system integration happens in an owner (Host)

export class Host {
  constructor(kind, container, composer) {
    this.id = makeId();
    this.kind = kind;
    this.container = container;
    this.composer = composer;
    this.createParticle(this.kind, this.id);
  }
  onready() {
    throw('Host was not assigned an onready listener.');
  }
  async createParticle(name, id) {
    const response = await Hub.request({msg: 'create', name, id});
    this.config = JSON.parse(response.configJSON);
    console.log(`host::createParticle: particle [${id}] configured:`, this.config);
    this.onready();
  }
  async update(inputs) {
    const outputs = await this.particleUpdate(inputs);
    if (inputs && outputs) {
      shallowMerge(shallowMerge({}, inputs), outputs);
    }
    return outputs;
  }
  render(model) {
    this.debounce = Xen.debounce(this.debounce, () => this.renderModel(model), 100);
  }
  renderModel(model) {
    const {id, name, container} = this;
    const {template} = this.config;
    console.log(`Host[${id}]::renderModel(${JSON.stringify(model)})`);
    this.composer.render({id, name, container, content: {template, model}});
  }
  // isolating 'things particle can do'
  async particleUpdate(inputs) {
    const inputJSON = JSON.stringify(inputs);
    const output = await Hub.request({msg: 'update', id: this.id, inputJSON});
    console.log(output);
    return output;
  }
}

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
  static async createHostedParticle(kind, container, composer) {
    const host = new Host(container, composer);
    await host.createParticle(kind);
    return host;
  }
  constructor(container, composer) {
    this.id = makeId();
    this.container = container;
    this.composer = composer;
    this.channel = Hub.openChannel(this.id, message => this.receive(message));
  }
  dispose() {
    this.channel.close();
  }
  async createParticle(kind) {
    const id = this.id;
    const response = await Hub.request({msg: 'create', kind, id});
    this.config = JSON.parse(response.configJSON);
    console.log(`host::createParticle: particle [${id}] configured:`, this.config);
  }
  onready() {
    throw('Host: nobody is listening to `onready`.');
  }
  async update(inputs) {
    const outputs = await this.particleUpdate(inputs);
    if (inputs && outputs) {
      shallowMerge(shallowMerge({}, inputs), outputs);
    }
    return outputs;
  }
  // isolating 'things particle can do'
  async particleUpdate(inputs) {
    //const inputJSON = JSON.stringify(inputs);
    const output = await Hub.request({msg: 'update', id: this.id, inputs});
    console.log(output);
    return output;
  }
  // messages from the Particle
  receive(message) {
    switch (message.msg) {
      case 'render':
        this.render(message.model);
        break;
    }
  }
  render(model) {
    this.debounce = Xen.debounce(this.debounce, () => this._render(model), 100);
  }
  _render(model) {
    const {id, name, container} = this;
    const {template} = this.config;
    console.log(`Host[${id}]::renderModel(${JSON.stringify(model)})`);
    this.composer.render({id, name, container, content: {template, model}});
  }
}

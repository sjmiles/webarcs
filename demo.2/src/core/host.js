/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Hub} from '../bus/hub.js';
import {debounce} from './utils.js';

// TODO(sjmiles): principle: Particles kept ignorant, system knowledge resides in an owner (Host)

export class Host {
  static async createParticle(id, name, kind, container, composer, onoutput) {
    const host = new Host(id, container, composer, onoutput);
    await host.createParticle(name, kind);
    return host;
  }
  constructor(id, container, composer, onoutput) {
    this.id = id;
    this.container = container;
    this.composer = composer;
    this.onoutput = onoutput;
    this.openChannel();
  }
  dispose() {
    this.closeChannel();
  }
  // TODO(sjmiles): replace with event system?
  onoutput() {
  }
  // actions provoked from priveleged-space
  async createParticle(name, kind) {
    this.config = await this.particleCreate(kind, this.id, name);
    console.log(`host::createParticle: particle [${this.id}] configured:`, this.config);
  }
  update(inputs) {
    this.particleUpdate(inputs);
  }
  // actions provoked from particle-space
  captureOutputs(outputs) {
    this.onoutput(this, outputs);
  }
  render(model) {
    const {id, name, container} = this;
    const {template} = this.config;
    // because rendering is debounced, be careful using this log to study data-changes
    //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
    this.composer.render({id, name, container, content: {template, model}});
  }
  debouncedRender(model) {
    //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
    this._debounceKey = debounce(this._debounceKey, () => this.render(model), 100);
  }
  //
  // TODO(sjmiles): abstract away references to Hub
  //
  // bus v
  openChannel() {
    this.channel = Hub.openChannel(this.id, message => this.receive(message));
    //this.channel = this.broker.openChannel(this.id, message => this.receive(message));
  }
  closeChannel() {
    this.channel.close();
  }
  // messages to Particle-space
  particleUpdate(inputs) {
    Hub.request({msg: 'update', id: this.id, inputs});
    //await this.channel.update({id: this.id, inputs});
  }
  async particleCreate(kind, id, name) {
    return (await Hub.request({msg: 'create', kind, id, name})).config;
    //return (await this.channel.update({id: this.id, inputs})).config;
  }
  // messages from Particle-space
  receive(message) {
    switch (message.msg) {
      case 'output':
        this.captureOutputs(message.model);
        break;
      case 'render':
        this.debouncedRender(message.model);
        break;
    }
  }
  // bus ^
}

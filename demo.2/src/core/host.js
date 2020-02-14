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

// TODO(sjmiles): principle: Particles remain stupid, system integration happens in an owner (Host)

export class Host {
  static async createHostedParticle(id, name, kind, container, composer) {
    const host = new Host(id, container, composer);
    await host.createParticle(name, kind);
    return host;
  }
  constructor(id, container, composer) {
    this.id = id;
    this.container = container;
    this.composer = composer;
    this.openChannel();
  }
  dispose() {
    this.closeChannel();
  }
  async createParticle(name, kind) {
    this.config = await this.particleCreate(kind, this.id, name);
    console.log(`host::createParticle: particle [${this.id}] configured:`, this.config);
  }
  async update(inputs) {
    console.log(`xxxhost[${this.id}]::update:`);
    const result = await this.particleUpdate(inputs);
    //console.groupEnd();
    console.log(`xxxhost[${this.id}]::update DONE`);
    return result;
  }
  render(model) {
    const {id, name, container} = this;
    const {template} = this.config;
    // because rendering is debounced, be careful using this log to study data-changes
    //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
    this.composer.render({id, name, container, content: {template, model}});
  }
  debouncedRender(model) {
    console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
    this._debounceKey = debounce(this._debounceKey, () => this.render(model), 100);
  }
  //
  // TODO(sjmiles): abstract Hub usage
  // bus v
  openChannel() {
    this.channel = Hub.openChannel(this.id, message => this.receive(message));
  }
  closeChannel() {
    this.channel.close();
  }
  // messages to Particle-space
  async particleUpdate(inputs) {
    return (await Hub.request({msg: 'update', id: this.id, inputs})).outputs;
  }
  async particleCreate(kind, id, name) {
    return (await Hub.request({msg: 'create', kind, id, name})).config;
  }
  // messages from Particle-space
  receive(message) {
    switch (message.msg) {
      case 'render':
        this.debouncedRender(message.model);
        break;
    }
  }
  // bus ^
}

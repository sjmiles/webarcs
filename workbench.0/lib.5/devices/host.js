/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../core/particle.js';

export const Host = class extends Particle {
  constructor({id, container, bus}) {
    super();
    this.id = id;
    this.container = container;
    this.bus = bus;
    this.bus.openChannel(id, message => this.dispatch(message));
  }
  dispose() {
    this.bus.closeChannel();
  }
  async createParticle(name, kind) {
    this._config = await this.bus.particleCreate(kind, this.id, name);
    console.log(`Host::createParticle: particle [${this.id}] configured:`, this.config);
  }
  get config() {
    return this._config;
  }
  update(inputs) {
    this.bus.particleUpdate(this.id, inputs);
  }
  dispatch(message) {
    const fn = this[message.msg];
    if (fn) {
      fn.call(this, message.model);
    }
  }
  handleEvent(eventlet) {
    this.bus.particleEvent(this.id, eventlet);
  }
};

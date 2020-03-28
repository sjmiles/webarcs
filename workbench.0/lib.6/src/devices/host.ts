/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module devices
 */

import {Particle} from '../core/particle.js';

export class Host extends Particle {
  container;
  bus;
  particleConfig;
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
  get config() {
    return this.particleConfig;
  }
  async createParticle(name, kind) {
    this.particleConfig = await this.bus.particleCreate(kind, this.id, name);
    console.log(`Host::createParticle: particle [${this.id}] configured:`, this.config);
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

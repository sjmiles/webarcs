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
import {makeId} from '../utils/utils.js';

export class Host extends Particle {
  id;
  container;
  channel;
  particleConfig;
  constructor({bus}) {
    super();
    this.id = makeId();
    bus.openChannel(this.id, message => this.dispatch(message));
    this.channel = bus;
  }
  dispose() {
    this.channel.closeChannel();
  }
  get config() {
    return this.particleConfig;
  }
  async createParticle(kind) {
    this.particleConfig = await this.channel.particleCreate(kind);
    console.log(`Host::createParticle: particle [${kind}] configured:`, this.config);
  }
  requestUpdate(inputs) {
    this.channel.particleUpdate(inputs);
  }
  dispatch(message) {
    const fn = this[message.msg];
    if (fn) {
      fn.call(this, message.model);
    }
  }
  handleEvent(eventlet) {
    this.channel.particleEvent(eventlet);
  }
};

export const createHostedParticle = async (kind, bus) => {
  const host = new Host({bus});
  await host.createParticle(kind);
  return host;
};

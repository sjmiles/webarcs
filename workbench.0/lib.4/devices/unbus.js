/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//import {debounce} from './utils.js';

export const Unbus = class {
  constructor() {
  }
  openChannel(listener) {
    this.listener = listener;
  }
  closeChannel() {
    this.listener = null;
  }
  // messages received from Particle-space
  send(message) {
    const fn = this.listener && this.listener[message.msg];
    if (fn) {
      fn.call(this.listener, message.model);
    }
  }
  // messages sent to Particle-space
  particleUpdate(inputs) {
    this.particles.update(inputs);
  }
  async particleCreate(kind, id) {
    this.id = id;
    this.particle = new kind();
    this.particle.onoutput = model => this.send({msg: 'output', model});
    return this.particle.config;
  }
};

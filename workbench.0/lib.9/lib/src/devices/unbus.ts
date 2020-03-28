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

export class Unbus {
  id;
  listener;
  particle;
  constructor() {
  }
  openChannel(id, listener) {
    this.id = id;
    this.listener = listener;
  }
  closeChannel() {
    this.listener = null;
  }
  async particleCreate(kind) {
    this.particle = new kind();
    this.particle.onoutput = model => this.listener({msg: 'onoutput', model});
    return this.particle.config;
  }
  particleUpdate(inputs) {
    this.particle.requestUpdate(inputs);
  }
  particleEvent(eventlet) {
    this.particle.handleEvent(eventlet);
  }
};

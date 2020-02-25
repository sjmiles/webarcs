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
    this.listener = listener;
  }
  closeChannel() {
    this.listener = null;
  }
  async particleCreate(kind, id) {
    this.id = id;
    this.particle = new kind();
    this.particle.onoutput = model => this.listener({msg: 'output', model});
    return this.particle.config;
  }
  particleUpdate(inputs) {
    this.particle.update(inputs);
  }
  particleEvent(eventlet) {
    this.particle.handleEvent(eventlet);
  }
};

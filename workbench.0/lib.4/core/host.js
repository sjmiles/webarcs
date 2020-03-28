/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Bus} from '../devices/bus.js';
import {debounce} from './utils.js';

export const Host = class {
  //
  // Public
  //
  constructor({id, container, bus}) {
    this.id = id;
    this.container = container;
    this.bus = bus;
    this.bus.openChannel(message => this.dispatch(message));
  }
  dispose() {
    this.bus.closeChannel();
  }
  // TODO(sjmiles): replace with event system?
  // impl to be assigned by owner
  onoutput() {
  }
  // impl to be assigned by owner
  onrender() {
  }
  async createParticle(name, kind) {
    this.config = await this.bus.particleCreate(kind, this.id, name);
    console.log(`Host::createParticle: particle [${this.id}] configured:`, this.config);
  }
  update(inputs) {
    this.bus.particleUpdate(inputs);
  }
  //
  // Private
  //
  dispatch(message) {
    const fn = this[message.msg];
    if (fn) {
      fn.call(this, message.model);
    }
  }
  output(model) {
    this.onoutput(model);
  }
  render(model) {
    //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
    this._debounceKey = debounce(this._debounceKey, () => this.debouncedRender(model), 100);
  }
  debouncedRender(model) {
    const {template} = this.config;
    const content = {template, model};
    const {id, name, container} = this;
    // because rendering is debounced, be careful using this log to study data-changes
    //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
    this.onrender({id, name, container, content});
  }
};

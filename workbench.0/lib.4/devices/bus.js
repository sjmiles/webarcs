/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//import {Hub} from '../bus/hub.js';
//import {debounce} from './utils.js';

export const Bus = class {
  constructor(hub) {
    this.hub = hub;
  }
  openChannel(listener) {
    const receiver = message => this.receive(listener, message);
    this.channel = this.hub.openChannel(this.id, receiver);
  }
  closeChannel() {
    this.channel.close();
    this.channel = null;
  }
  // messages received from Particle-space
  receive(listener, message) {
    // forward to handler `onMessageName` in listener
    const handlerName = (s => `on${s.charAt(0).toUpperCase() + s.slice(1)}`)(message.msg);
    const fn = listener && listener[handlerName];
    if (fn) {
      fn.call(listener, message.model);
    }
  }
  // messages sent to Particle-space
  particleUpdate(inputs) {
    this.hub.request({msg: 'update', id: this.id, inputs});
  }
  async particleCreate(kind, id, name) {
    return (await this.hub.request({msg: 'create', kind, id, name})).config;
  }
};

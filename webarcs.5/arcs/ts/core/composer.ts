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
 * @module core
 */

//import {Xen} from '../../../../../xen/xen-async.js';
import {EventEmitter} from './event-emitter.js';
import {logFactory} from '../utils/log.js';
//import {IconsCss} from '../../../../../assets/css/icons.css.js';

const log = logFactory(logFactory.flags.composer, 'composer', 'red');

export interface RenderPacket {
  id;
  container;
  content: {
    template,
    model
  }
};

export interface Slot {
};

export class Composer extends EventEmitter {
  protected slots;
  protected pendingPackets;
  constructor() {
    super();
    this.slots = {};
    this.pendingPackets = [];
  }
  activate() {
    this.fire('activate');
  }
  render(packet: RenderPacket) {
    const {id, container, content: {template, model}} = packet;
    log({id, /*container, template,*/ model: `{${Object.keys(model).join(', ')}}`});
    let slot = this.slots[id];
    if (!slot) {
      const parent = this.findContainer(container);
      if (!parent) {
        this.pendingPackets.push(packet);
        //log.warn(`container unavailable for slot`, id);
        return;
      }
      slot = this.generateSlot(id, template, parent);
    }
    if (slot) {
      this.slots[id] = slot;
      slot.set(model);
      this.processPendingPackets();
    }
  }
  findContainer(container) {
    return null;
  }
  processPendingPackets() {
    const packets = this.pendingPackets;
    if (packets.length) {
      this.pendingPackets = [];
      packets.forEach(packet => this.render(packet));
      // if (this.pendingPackets.length == 0) {
      //   console.warn('YAY, cleaned up pendingPackets');
      // }
    }
  }
  generateSlot(id, template, parent): Slot {
    return null;
  }
  onevent(pid, eventlet) {
    log(`[${pid}] sent [${eventlet.handler}] event`);
  }
};

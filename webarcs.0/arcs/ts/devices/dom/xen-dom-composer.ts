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

import {Xen} from '../../../../../xen/xen-async.js';
import {logFactory} from '../../utils/log.js';

const log = logFactory(logFactory.flags.render, 'render', 'red');

interface RenderPacket {
  id;
  container;
  content: {
    template,
    model
  }
};

const sanitizeId = id => id.replace(/[)(:]/g, '_');

export class Composer {
  private root;
  private slots;
  private pendingPackets;
  constructor(root) {
    this.root = root || document.body;
    this.slots = {};
    this.pendingPackets = [];
  }
  render(packet: RenderPacket) {
    const {id, container, content: {template, model}} = packet;
    log('render:', {id, container, template, model});
    let slot = this.slots[id];
    if (!slot) {
      const parent = this.findContainer(container);
      if (!parent) {
        this.pendingPackets.push(packet);
        //log.warn(`container unavailable for slot`, id);
        return;
      }
      slot = this.generateSlot(id, template, parent);
      this.slots[id] = slot;
    }
    slot.set(model);
    this.processPendingPackets();
  }
  findContainer(container) {
    let node = this.root;
    if (container && container !== 'root') {
      const [particle, slot] = container.split('#');
      const owner = deepQuerySelector(node, `#${sanitizeId(particle)}`);
      node = deepQuerySelector(owner, `[slot=${slot}]`);
      // const slots = container.split(':');
      // slots.forEach(slot => {
      //   if (slot !== 'root') {
      //     node = deepQuerySelector(node, `[slot=${slot}]`);
      //     //node = node.querySelector(`[slot=${slot}]`);
      //   }
      // });
      log(container, node);
    }
    return node;
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
  private generateSlot(id, template, parent) {
    const container = parent.appendChild(document.createElement('div'));
    container.id = sanitizeId(id);
    const root = container.attachShadow({mode: `open`});
    const slot = Xen.Template
      .stamp(template)
      .appendTo(root)
      .events(this.mapEvent.bind(this, id))
    ;
    return slot;
  }
  private mapEvent(pid, node, type, handler) {
    node.addEventListener(type, e => {
      const data = {key: null, value: null};
      // walk up the event path to find the topmost key/value data
      const branch = e.composedPath();
      for (let elt of branch) {
        if ('key' in elt) {
          data.key = elt.key;
        } else if (elt.hasAttribute('key')) {
          data.key = elt.getAttribute('key');
        }
        if ('value' in elt) {
          data.value = elt.value;
        } else if (elt.hasAttribute('value')) {
          data.key = elt.getAttribute('value');
        }
        if (e.currentTarget === elt) {
          break;
        }
      }
      const eventlet = {name, handler, data};
      this.onevent(pid, eventlet);
    });
  }
  onevent(pid, eventlet) {
    log(`[${pid}] sent [${eventlet.handler}] event`);
  }
};

const deepQuerySelector = (root, selector) => {
  const find = (element, selector) => {
    let result;
    while (element && !result) {
      result =
          (element.matches && element.matches(selector) ? element : null)
          || find(element.firstElementChild, selector)
          || (element.shadowRoot && find(element.shadowRoot.firstElementChild, selector))
          ;
      element = element.nextElementSibling;
    }
    return result;
  };
  return find(root || document.body, selector);
};

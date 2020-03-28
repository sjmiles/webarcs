/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../../xen/xen-async.js';

export const Composer = class {
  constructor(root) {
    this.root = root || document.body;
    this.slots = {};
  }
  render({id, container, content: {template, model}}) {
    console.log('render:', {id, container, model}); //: Object.keys(model || Object)});
    let slot = this.slots[id];
    if (!slot) {
      let parent = this.root;
      if (container && container !== 'root') {
        parent = parent.querySelector(`[slot=${container}]`);
      }
      if (!parent) {
        console.warn(`container unavailable for slot`, id);
        return;
      }
      const mapper = this.mapEvent.bind(this, id);
      slot = this.slots[id] = Xen.Template.stamp(template).appendTo(parent).events(mapper);
      slot.name = name;
    }
    slot.set(model);
  }
  mapEvent(pid, node, type, handler) {
    node.addEventListener(type, e => {
      const {key, value} = e.currentTarget;
      const eventlet = {name, handler, data: {key, value}};
      this.onevent(pid, eventlet);
    });
  }
  onevent(pid, eventlet) {
    console.log(`[${pid}] sent [${eventlet.handler}] event`);
  }
};

/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Xen} from '../../xen/xen-async.js';

export class Composer {
  constructor(root) {
    this.root = root || document.body;
    this.slots = {};
  }
  render({id, name, container, content: {template, model}}) {
    let slot = this.slots[id];
    if (!slot) {
      let parent = this.root;
      if (container) {
        const node = parent.querySelector(`[slot=${container}]`);
        parent = node || parent;
      }
      const mapper = this.mapEvent.bind(this, id);
      slot = this.slots[id] = Xen.Template.stamp(template).appendTo(parent).events(mapper);
      slot.name = name;
    }
    slot.set(model);
  }
  mapEvent(pid, node, type, handler) {
    node.addEventListener(type, e => {
      console.log(`${handler} event [${pid}]`);
    });
  }
};

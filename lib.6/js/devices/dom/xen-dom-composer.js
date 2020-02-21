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
import { Xen } from '../../../../xen/xen-async.js';
;
export class Composer {
    constructor(root) {
        this.root = root || document.body;
        this.slots = {};
    }
    render(packet) {
        const { id, container, content: { template, model } } = packet;
        console.log('render:', { id, container, model });
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
            slot = this.generateSlot(id, template, parent);
            this.slots[id] = slot;
        }
        slot.set(model);
    }
    generateSlot(id, template, parent) {
        const slot = Xen.Template
            .stamp(template)
            .appendTo(parent)
            .events(this.mapEvent.bind(this, id));
        return slot;
    }
    mapEvent(pid, node, type, handler) {
        node.addEventListener(type, e => {
            const { key, value } = e.currentTarget;
            const eventlet = { name, handler, data: { key, value } };
            this.onevent(pid, eventlet);
        });
    }
    onevent(pid, eventlet) {
        console.log(`[${pid}] sent [${eventlet.handler}] event`);
    }
}
;

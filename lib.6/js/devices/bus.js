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
export class Bus {
    constructor(hub) {
        this.hub = hub;
    }
    openChannel(id, listener) {
        const receiver = message => listener(message);
        this.channel = this.hub.openChannel(id, receiver);
    }
    closeChannel() {
        this.channel.close();
        this.channel = null;
    }
    // messages sent to Particle-space
    async particleCreate(kind, id, name) {
        return (await this.channel.request({ msg: 'create', kind, id, name })).config;
    }
    particleUpdate(id, inputs) {
        this.channel.request({ msg: 'update', id, inputs });
    }
    particleEvent(id, eventlet) {
        this.channel.request({ msg: 'event', id, eventlet });
    }
}
;

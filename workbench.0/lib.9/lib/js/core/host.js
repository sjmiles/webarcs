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
import { Particle } from './particle.js';
/**
 * Host owns metadata (e.g. `id`, `container`) that the Particle
 * itself is not allowed to access.
 */
export class Host extends Particle {
    constructor(particle, id, container) {
        super();
        this.id = id;
        this.container = container;
        this.particle = particle;
        particle.onoutput = output => this.output(output);
    }
    output(output) {
        this.onoutput(output);
    }
    get config() {
        return this.particle.config;
    }
    requestUpdate(inputs) {
        return this.particle.requestUpdate(inputs);
    }
    render(inputs) {
        return this.particle.render(inputs);
    }
    handleEvent(eventlet) {
        return this.particle.handleEvent(eventlet);
    }
}
;

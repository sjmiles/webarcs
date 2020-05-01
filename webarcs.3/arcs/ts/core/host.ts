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

import {Particle, Eventlet} from './particle.js';

export type ParticleMeta = {
  id: string,
  kind: string,
  container: string
  // arbitrary field definitions
};

/**
 * Host owns metadata (e.g. `id`, `container`) that the Particle
 * itself is not allowed to access.
 */
export class Host extends Particle {
  public id: string;
  public container: string;
  public meta;
  public particle: Particle;
  constructor(meta: ParticleMeta, particle: Particle) {
    super();
    this.meta = meta;
    // promoted for convenience
    this.id = meta.id;
    // promoted for convenience
    this.container = meta.container;
    this.particle = particle;
    particle.onoutput = output => this.output(output);
  }
  protected output(output?) {
    this.onoutput(output);
  }
  public get config() {
    return this.particle.config;
  }
  public requestUpdate(inputs) {
    return this.particle.requestUpdate(inputs);
  }
  public handleEvent(eventlet: Eventlet) {
    return this.particle.handleEvent(eventlet);
  }
};


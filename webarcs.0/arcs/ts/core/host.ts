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

/**
 * Host owns metadata (e.g. `id`, `container`) that the Particle
 * itself is not allowed to access.
 */
export class Host extends Particle {
  public id: string;
  public container: string;
  public spec;
  public particle: Particle;
  constructor(id, container, spec, particle) {
    super();
    this.id = id;
    this.container = container;
    this.spec = spec;
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
  // public render(inputs) {
  //   return this.particle.render(inputs);
  // }
  public handleEvent(eventlet: Eventlet) {
    return this.particle.handleEvent(eventlet);
  }
};


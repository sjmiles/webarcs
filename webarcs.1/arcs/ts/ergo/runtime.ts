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
 * @module ergo
 */

import {Store} from '../data/store.js';
import {Host} from '../core/host.js';
import {Arc} from '../core/arc.js';
import {Recipe} from './recipe.js';
import {logFactory} from '../utils/log.js';
import {makeId} from '../utils/id.js';

const log = logFactory(logFactory.flags.ergo, 'runtime', 'purple');

type ParticleSpec = {
  kind: string
};

type Container = string;

export class Runtime {
  tenant;
  private registry = {};
  constructor(tenant) {
    this.tenant = tenant;
  }
  register(name, factory) {
    this.registry[name] = factory;
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
  public async addParticle(arc: Arc, spec: ParticleSpec, container: Container) {
    const id = `${arc.id}:${spec.kind}(${makeId()})`;
    const particle = await this.createParticle(arc, spec, container);
    particle.id = id;
    if (particle) {
      log(`adding particle ${id}`);
      const host = new Host(id, container, spec, particle);
      arc.addHost(host);
    } else {
      log.error(`failed to create particle "${id}" (is the kind registered?)`)
    }
    return particle;
  }
  public async createParticle(arc: Arc, spec: ParticleSpec, container: Container): Promise<Host> {
    // `spec` is just a String for now
    const factory = this.registry[spec.kind];
    if (factory) {
      return await factory();
    }
  }
};

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

//import {Store} from '../data/store.js';
import {Host} from '../core/host.js';
import {Arc} from '../core/arc.js';
import {Recipe} from './recipe.js';
import {logFactory} from '../utils/log.js';
//import {makeId} from '../utils/id.js';

const log = logFactory(logFactory.flags.ergo, 'runtime', 'magenta');

type ParticleSpec = {
  kind: string
};

type Container = string;

const registry = {};

export class Runtime {
  tenant;
  //private registry = {};
  constructor(tenant) {
    this.tenant = tenant;
  }
  static register(name, factory) {
    registry[name] = factory;
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
  public async createHostedParticle(id, spec: ParticleSpec, container: Container) {
    const particle = await this.createParticle(spec);
    if (particle) {
      particle.id = id;
      return new Host(id, container, spec, particle);
    }
    log.error(`failed to create particle "${id}" (is the kind registered?)`)
    return null;
  }
  public async createParticle(spec: ParticleSpec): Promise<Host> {
    const factory = registry[spec.kind];
    if (factory) {
      return await factory();
    }
  }
};

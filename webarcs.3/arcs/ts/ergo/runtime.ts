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
//import {makeId} from '../utils/id.js';

const log = logFactory(logFactory.flags.ergo, 'runtime', 'magenta');

type ParticleSpec = {
  kind: string
};

type Container = string;

// expensive, so Highlander
const registry = {};

export class Runtime {
  tenant;
  constructor(tenant) {
    this.tenant = tenant;
  }
  static register(name, factory) {
    registry[name] = factory;
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
  requireStore(arc, key, spec) {
    // normalize spec
    if (typeof spec === 'string') {
      spec = {store: spec};
    }
    spec.store = spec.store || key;
    spec.type = spec.type || 'Any';
    spec.tags = spec.tags || ['default'];
    const name = spec.store;
    // construct store id preamble
    const id = `${arc.id}:store:${name}:${spec.type}:${spec.tags.join(',')}:${this.tenant.id}`;
    return this.createStore(id, spec);
  }
  createStore(id, spec) {
    log(`createStore(${id})`, spec);
    const name = spec.store;
    const store = new Store(this.tenant.id, id, name, spec.type, spec.tags);
    store.spec = spec;
    if (!store.restore()) {
      const value = spec.value || (store.isCollection() ? {} : '');
      // initialize data
      store.change(data => data[name] = value);
    } else {
      // TODO(sjmiles): pretend we have changed for our new listener
      // instead, perhaps newly added set-truth listeners should automatically be fired
      //store.changed();
    }
    return store;
  }
  async createHostedParticle(id, spec: ParticleSpec, container: Container) {
    const particle = await this.createParticle(spec.kind);
    if (particle) {
      // TODO(sjmiles): exposing id to the particle is bad but there was a reason ... study
      particle.id = id;
      return new Host(id, container, spec, particle);
    }
    log.error(`failed to create particle "${id}"`);
    return null;
  }
  async createParticle(kind: string): Promise<Host> {
    const factory = registry[kind];
    if (factory) {
      return await factory();
    } else {
      log.error(`createParticle: "${kind}" not in registry`);
    }
  }
};

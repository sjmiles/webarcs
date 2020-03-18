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

import {Recipe} from './recipe.js';
import {makeId} from '../utils/utils.js';
import {Host} from '../core/host.js';
import {Arc} from '../core/Arc.js';

type ParticleSpec = string;
type Container = string;

export class Runtime {
  private registry;
  constructor() {
    this.registry = {};
  }
  register(name, factory) {
    this.registry[name] = factory;
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
  public async addParticle(arc: Arc, spec: ParticleSpec, container: Container) {
    const particle = await this.createParticle(arc, spec, container);
    const id = `${arc.id}:${spec}(${makeId()})`;
    const host = new Host(particle, id, container);
    arc.addHost(host);
    console.log(`added ${id}`);
  }
  public async createParticle(arc: Arc, spec: ParticleSpec, container: Container): Promise<Host> {
    // `spec` is just a String for now
    const factory = this.registry[spec];
    if (factory) {
      return await factory();
    }
  }
};

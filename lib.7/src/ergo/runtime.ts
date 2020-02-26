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
import {makeId} from '../core/utils.js';

export class Runtime {
  private registry;
  constructor() {
    this.registry = {};
  }
  register(name, factory) {
    this.registry[name] = factory;
  }
  async instantiate(arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
  public async addParticle(arc, spec, container) {
    // `spec` is just a String for now
    const factory = this.registry[spec];
    if (factory) {
      const id = `${arc.id}:${spec}(${makeId()})`;
      const onoutput = outputs => arc.particleOutput(particle, outputs);
      const particle = await factory(id, container);
      arc.addParticle(particle);
      // TODO(sjmiles): this stuff needs to not be on particle, we need another map
      particle.id = id;
      particle.container = container;
      particle.onoutput = onoutput;
      console.log(`added ${id}`);
    }
  }
};

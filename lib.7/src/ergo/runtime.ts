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

import {Recipe} from '../ergo/recipe.js';

export class Runtime {
  private registry;
  constructor() {
    this.registry = {};
  }
  register(name, factory) {
    this.registry[name] = factory;
  }
  registerClass(name, clss) {
    this.register(name, async () => new clss());
  }
  async instantiate(arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
  }
};

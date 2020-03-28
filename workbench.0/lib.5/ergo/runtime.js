/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Recipe} from '../ergo/recipe.js';

export const Runtime = class {
  constructor() {
    this.registry = {};
  }
  register(name, ctor) {
    this.registry[name] = ctor;
  }
  instantiate(arc, recipe) {
    Recipe.instantiate(this, arc, recipe);
  }
};

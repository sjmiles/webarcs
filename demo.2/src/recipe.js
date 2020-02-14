/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const Recipe = class {
  static instantiate(arc, recipe, container) {
    Object.keys(recipe).forEach(key => {
      if (key === 'particle') {
        console.log(`adding ${recipe.particle} particle`);
        arc.addParticle(recipe[key], container);
      } else {
        console.log(`populating [${key}]...`);
        recipe[key].forEach(r => this.instantiate(arc, r, key));
      }
    });
  }
};


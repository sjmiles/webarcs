/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

//
// Recipes contain slots and particles.
//
// {
//   <slotName>: [{
//     particle: '<ParticleClass>',
//     <slotName>: [{ ... }]
//   }]
// }
//
// Example
//
// {
//   root: [{                    // `root` slot
//     particle: 'Container',    // `root` contains `Container` particle
//     content: [{               // `Container` particle owns `content` slot
//       particle: 'Info'        // `content` contains `Info` particle
//     }, {
//       particle: 'TMDBSearch'  // `content` contains 'TMDBSearch` particle
//     }]
//   }, {
//     particle: 'SortArray'     // `root` contains 'SortArray' particles
//   }]
// }

export const Recipe = class {
  static instantiate(arc, recipe, container) {
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
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


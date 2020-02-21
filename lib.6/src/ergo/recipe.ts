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

export class Recipe {
  static instantiate(runtime, arc, recipe, container?) {
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
    Object.keys(recipe).forEach(key => {
      const info = recipe[key];
      if (key === 'particle') {
        //console.log(`adding ${recipe.particle} particle`);
        arc.addParticle(runtime, info, container);
      } else {
        let node = info;
        if (!Array.isArray(node)) {
          node = [node]
        }
        console.log(`populating [${key}]...`);
        node.forEach(r => this.instantiate(runtime, arc, r, key));
      }
    });
  }
};



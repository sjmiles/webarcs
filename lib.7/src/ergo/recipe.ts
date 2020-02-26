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
  static async instantiate(runtime, arc, recipe, container?) {
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
    Promise.all(Object.keys(recipe).map(async key => {
      let info = recipe[key];
      if (key === 'particle') {
        if (typeof info === 'string') {
          info = {kind: info};
        }
        console.log(`recipe: adding ${recipe.particle} particle`);
        await runtime.addParticle(arc, info.kind, container);
      } else {
        let node = info;
        if (!Array.isArray(node)) {
          node = [node]
        }
        console.log(`recipe: populating [${key}]...`);
        Promise.all(node.map(r => this.instantiate(runtime, arc, r, key)));
      }
    }));
  }
};



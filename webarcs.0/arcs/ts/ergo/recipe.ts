/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {logFactory} from '../../../../webarcs.1/ts/utils/log.js';

/**
 * @packageDocumentation
 * @module ergo
 */

const log = logFactory(logFactory.flags.ergo, 'recipe', 'purple');
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
//
export class Recipe {
  static async instantiate(runtime, arc, recipe, container?) {
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
    let particle;
    for (const key in recipe) {
      let info = recipe[key];
      if (typeof info === 'string') {
        info = {kind: info};
      }
      if (key === 'particle') {
        particle = await this.instantiateParticle(runtime, arc, info, container);
      } else {
        await this.instantiateSlot(runtime, arc, key, info, particle, container);
      }
    }
    // await Promise.all(Object.keys(recipe).map(async key => {
    //   let info = recipe[key];
    //   if (typeof info === 'string') {
    //     info = {kind: info};
    //   }
    //   if (key === 'particle') {
    //     particle = await this.instantiateParticle(runtime, arc, info, container);
    //   } else {
    //     await this.instantiateSlot(runtime, arc, key, info, particle, container);
    //   }
    //   //await this.consumeRecipeNode(runtime, arc, key, recipe[key], container);
    // }));
    runtime.createArcStores(arc);
  }
  static async instantiateParticle(runtime, arc, info, container) {
    if (typeof info === 'string') {
      info = {kind: info};
    }
    log(`adding ${info.kind} particle`);
    return await runtime.addParticle(arc, info, container);
  }
  static async instantiateSlot(runtime, arc, key, info, particle, container) {
    if (!Array.isArray(info)) {
      info = [info]
    }
    //container = container ? `${container}:${key}`: key;
    //log(`populating [${container}]...[${particle ? particle.id : 'no particle'}]`);
    container = particle ? `${particle.id}#${key}` : key;
    log(`populating [${container}]`);
    await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
  }
}

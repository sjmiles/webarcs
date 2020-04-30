/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// import {Arc} from '../core/arc.js';
// import {Store} from '../data/store.js';
import {makeId} from '../utils/id.js';
import {logFactory} from '../utils/log.js';

/**
 * @packageDocumentation
 * @module ergo
 */

const log = logFactory(logFactory.flags.ergo, 'recipe', 'purple');
//
// Recipes contain two sections: (1) stores and (2) slots and particles.
//
// {
//   stores: [{
//     <storeName>: {
//       type, tags[]?, value?, id?
//     }
//   }]
//   <slotName>: [{
//     particle: '<kind>' || particle: {kind, <propertyName>: <storeName>, ...}
//     <slotName>: [{ ... }]
//   }]
// }
//

// TODO(sjmiles): do we need qualified names, like `$particle` or something?

const KEYS = {
  PARTICLE: 'particle',
  STORES: 'stores'
};

export class Recipe {
  static async instantiate(runtime, arc, recipe, container?) {
    // convert shorthand to longhand before parsing
    // TODO(sjmiles): would be great if it normalized all the things
    recipe = this.normalize(recipe);
    let particle;
    for (const key in recipe) {
      let info = recipe[key];
      switch(key) {
        case KEYS.STORES:
          this.realizeStores(runtime, arc, info);
          break;
        case KEYS.PARTICLE:
          particle = await this.instantiateParticle(runtime, arc, info, container);
          break;
        default:
          await this.instantiateSlot(runtime, arc, key, info, particle, container);
          break;
      }
    }
  }
  static normalize(recipe) {
    // TODO(sjmiles): would be great if we normalized all the things
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
    if (typeof recipe !== 'object') {
      throw Error('recipe must be an Object');
    }
    return recipe;
  }
  static realizeStores(runtime, arc, specs) {
    log(`realizeStores for "${arc.id}"`);
    Object.keys(specs).forEach(name => {
      log(`realizeStores: requireStore: "${name}"`);
      const store = runtime.requireStore(arc, name, specs[name]);
      if (!store) {
        log.error('realizeStores: requireStore returned null');
      } else {
        // store changes cause host updates
        // TODO(sjmiles): too blunt: this updates all hosts regardless of their interest in this store
        // TODO(sjmiles): `inputs` sent to updateHosts is not the complete set of inputs as may be expected, but
        // instead it's just the latest from here. Hosts accrete inputs (for better or worse).
        store.listen('set-truth', () => {
          arc.updateHosts(store.pojo);
        });
        // add to context
        runtime.tenant.context.add(store);
        // add to arc
        arc.stores.push(store);
      }
    });
  }
  static async instantiateParticle(runtime, arc, spec, container) {
    if (typeof spec === 'string') {
      spec = {kind: spec};
    }
    log(`adding ${spec.kind} particle`);
    const id = `${arc.id}:${spec.kind}(${makeId()})`;
    // TODO(sjmiles): technically 'particles' are owned by 'hosts' but
    // I tried to hide the difference. Could be confusing here, since
    // `instantiateParticle` returns a Host (even though Host *is* a Particle [by extension]).
    const host = await runtime.createHostedParticle(id, spec, container);
    if (host) {
      arc.addHost(host);
    }
    return host;
  }
  static async instantiateSlot(runtime, arc, key, info, particle, container) {
    if (!Array.isArray(info)) {
      info = [info]
    }
    container = particle ? `${particle.id}#${key}` : key;
    log(`populating [${container}]`);
    //
    // TODO(sjmiles): parallelized process works but is chaotic to analyze ...
    // linearize for now to ease understanding. Beware of dependencies on process order
    // creeping in.
    //await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
    for (let child of info) {
      await this.instantiate(runtime, arc, child, container);
    }
  }
}

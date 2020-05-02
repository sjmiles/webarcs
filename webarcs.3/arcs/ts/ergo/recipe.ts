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
import {Store} from '../data/store.js';
import {makeId} from '../utils/id.js';
import {logFactory} from '../utils/log.js';

/**
 * @packageDocumentation
 * @module ergo
 */

const log = logFactory(logFactory.flags.ergo, 'recipe', 'purple');
//
// Recipes are made of (1) stores, (2) slots, and (3) particles.
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

type RecipeSpec = {
  stores?: [{}]
  // arbitrary slot specs
};

type StoreSpec = {
  id: string;
  type: string;
  tags?: [string];
  value?: any;
};

type ParticleSpec = {
  kind: string
  // arbitrary field specs
};

type ChildSpec = {
  particle: ParticleSpec
  // arbitrary slot specs
};

type SlotSpec = [ChildSpec];

// keywords in recipe JSON:
// TODO(sjmiles): do we need qualified names, like `$particle` or something?
const KEYS = {
  PARTICLE: 'particle',
  STORES: 'stores'
};

export class Recipe {
  static async instantiate(runtime, arc, recipe: RecipeSpec, container?) {
    // convert shorthand to longhand before parsing
    // TODO(sjmiles): would be great if it normalized all the things
    recipe = this.normalize(recipe);
    await this.instantiateNode(runtime, arc, recipe, container);
  }
  static async instantiateNode(runtime, arc, recipe: RecipeSpec | ChildSpec, container?) {
    let particle;
    for (const key in recipe) {
      let info = recipe[key];
      switch (key) {
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
  static normalize(recipe: RecipeSpec): RecipeSpec {
    // TODO(sjmiles): would be great if we normalized all the things
    if (Array.isArray(recipe)) {
      recipe = {_: recipe} as RecipeSpec;
    }
    if (typeof recipe !== 'object') {
      throw Error('recipe must be an Object');
    }
    return recipe;
  }
  static realizeStores(runtime, arc, specs) {
    log(`realizeStores for "${arc.id}": ${Object.keys(specs).join(', ')}`);
    Object.keys(specs).forEach(key => this.realizeStore(runtime, arc, key, specs[key]));
  }
  static realizeStore(runtime, arc, key, spec) {
    const id = this.specToId(arc, key, spec, runtime.tenant.id);
    runtime.realizeStore(arc, id, key, spec.value);
  }
  static specToId(arc, key, spec, tenantid) {
    // normalize spec
    if (typeof spec === 'string') {
      spec = {name: spec};
    }
    const name = spec.name || key;
    const type = spec.type || 'Any';
    const tags = spec.tags || ['default'];
    // construct store id
    return Store.idFromMeta({arcid: arc.id, name, type, tags, tenantid});
  }
  static async instantiateParticle(runtime, arc, spec: ParticleSpec, container) {
    // TODO(sjmiles): should be fixed via normalization
    if (typeof spec === 'string') {
      spec = {kind: spec};
    }
    const id = `${arc.id}:${spec.kind}(${makeId()})`;
    const meta = {id, ...spec, container};
    return await arc.addParticle(runtime, meta);
  }
  static async instantiateSlot(runtime, arc, key, info: SlotSpec, particle, container) {
    // TODO(sjmiles): should be fixed via normalization
    if (!Array.isArray(info)) {
      info = [info]
    }
    container = particle ? `${particle.id}#${key}` : key;
    log(`populating [${container}]`);
    // TODO(sjmiles): parallelized process works but is chaotic when analyzed ...
    // serialize for now to ease understanding. Beware of creeping dependencies on process order.
    //await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
    for (let child of info) {
      await this.instantiateNode(runtime, arc, child, container);
    }
  }
}

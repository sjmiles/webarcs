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
// Recipes are made of (1) stores, (2) slots, (3) particles, and (4) metadata.
//
// {
//   meta: {
//     modality?: string
//   }
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
  META: 'meta',
  PARTICLE: 'particle',
  STORES: 'stores'
};

const {keys, entries} = Object;

export class Recipe {
  static async instantiate(runtime, arc, recipe: RecipeSpec, container?) {
    log.dir(`instantiate`, recipe);
    // `normalize` converts shorthand to longhand before parsing
    // TODO(sjmiles): would be great if it normalized all the things
    await this.instantiateNode(runtime, arc, this.normalize(recipe), container);
  }
  static async instantiateNode(runtime, arc, recipe: RecipeSpec | ChildSpec, container?) {
    let particle;
    for (const key in recipe) {
      let info = recipe[key];
      switch (key) {
        case KEYS.META:
          arc.extra.modality = info.modality;
          break;
        case KEYS.STORES:
          // real stores are mapped to the arc, but they may not be instantiated
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
    log(`realizeStores for "${arc.id}": ${keys(specs).join(', ')}`);
    keys(specs).forEach(name => this.realizeStore(runtime, arc, name, specs[name]));
    entries(specs).forEach(([name, spec]) => {
      this.realizeStore(runtime, arc, name, spec)
      arc.storeSpecs[name] = spec;
    });
  }
  static realizeStore(runtime, arc, name, spec) {
    // TODO(sjmiles): if we end up creating a Store, the spec.tags will be baked into it.
    // Otherwise, the spec.tags are stored in Arc::extra metadata.
    // It's a muddle, see if we can do away with tags on the Store itself.
    const id = this.specToId(arc, name, spec, runtime.tenant.id);
    const extra = this.specToExtra(spec);
    runtime.realizeStore(arc, id, {name, ...extra});
  }
  static specToId(arc, key, spec, tenantid) {
    // normalize spec
    if (typeof spec === 'string') {
      spec = {name: spec};
    }
    const {name, type, tags} = spec;
    const meta = {
      arcid: arc.id,
      name: name || key,
      type: type || 'Any',
      tags: tags || ['default'],
      tenantid
    }
    // construct store id
    return Store.idFromMeta(meta);
  }
  static specToExtra({value, tags}) {
    const extra =  {};
    if (tags) {
      extra["tags"] = tags;
    }
    if (value) {
      extra["value"] = value;
    }
    return extra;
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
    // TODO(sjmiles): parallelized process works but is hard to analyze (chaotic signals) ...
    // serialize for now to ease debugging. Beware of dependencies creeping onto processing order.
    //await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
    for (let child of info) {
      await this.instantiateNode(runtime, arc, child, container);
    }
  }
}

/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Arc} from '../core/arc.js';
import {Store} from '../data/store.js';
import {logFactory} from '../utils/log.js';

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
      if (key === 'particle') {
        particle = await this.instantiateParticle(runtime, arc, info, container);
      } else {
        await this.instantiateSlot(runtime, arc, key, info, particle, container);
      }
    }
    this.createArcStores(runtime, arc);
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
    container = particle ? `${particle.id}#${key}` : key;
    log(`populating [${container}]`);
    await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
  }
  static createArcStores(runtime, arc) {
    arc.hosts.forEach(host => this.createParticleStores(runtime, arc, host));
  }
  static createParticleStores(runtime, arc, host) {
    Object.keys(host.spec).forEach(key => {
      switch(key) {
        case 'kind':
          break;
        default: {
          this.requireStore(runtime, arc, key, host.spec[key]);
        }
      }
    });
  }
  static requireStore(runtime, arc: Arc, key, spec) {
    if (typeof spec === 'string') {
      spec = {store: spec};
    }
    if (!spec.store) {
      spec.store = key;
    }
    const name = spec.store;
    const id = `${arc.id}:store:${name}`;
    if (arc.stores.find(s => s.id === id)) {
      return null;
    }
    log(`requireStore: creating ${id}`); //[${this.tenant.id}]`);
    const store = new Store(`${arc.id}:store:${name}`);
    store.name = name;
    // store changes cause host updates
    store.listen('set-truth', () => {
      arc.updateHosts(store.pojo);
    });
    // initialize data
    store.change(data => data[name] = {});
    // add to context
    if (spec.share !== false) {
      runtime.tenant.context.add(store);
    } else {
      //log.warn('leaving no-share store out of context', store);
    }
    arc.stores.push(store);
    return store;
  }
}

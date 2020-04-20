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
import {makeId} from '../utils/id.js';
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
  static async instantiateParticle(runtime, arc, spec, container) {
    if (typeof spec === 'string') {
      spec = {kind: spec};
    }
    log(`adding ${spec.kind} particle`);
    const id = `${arc.id}:${spec.kind}(${makeId()})`;
    // TODO(sjmiles): technically 'particles' are owned by 'hosts' but
    // we tried to hide the difference. This could be confusing here, since
    // `instantiateParticle` returns a Host.
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
    await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
  }
  static createArcStores(runtime, arc) {
    arc.hosts.forEach(host => this.createParticleStores(runtime, arc, host));
  }
  static createParticleStores(runtime, arc, host) {
    // study host.spec bindings to locate needed stores
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
    // TODO(sjmiles): either we find a store with this `name` in
    // the arc.stores, or we create a new Store.
    // We need fancier finding. Also, `name` vs `id` is ad-hoc.
    //
    const name = spec.store;
    const id = `${arc.id}:store:${name}`;
    if (arc.stores.find(s => s.id === id)) {
      return null;
    }
    //
    //
    log(`requireStore: creating ${id}`); //[${this.tenant.id}]`);
    const store = new Store(runtime.tenant.id, id);
    store.name = name;
    // store changes cause host updates
    // TODO(sjmiles): too blunt: this updates all hosts regardless of their interest in this store
    // TODO(sjmiles): `inputs` sent to updateHosts is not the complete set of inputs as may be expected, but
    // instead it's just the latest from here. Hosts accumulate inputs (for better or worse).
    store.listen('set-truth', () => {
      arc.updateHosts(store.pojo);
    });
    // initialize data
    if (store.truth[name] === undefined) {
      store.change(data => data[name] = {});
    } else {
      // TODO(sjmiles): pretend we have changed for our new listener
      // instead, perhaps newly added set-truth listeners should automatically be fired
      store.fire('set-truth');
      //console.warn('... data was initialized via persistence');
    }
    store.shared = spec.share !== false;
    // add to context
    runtime.tenant.context.add(store);
    // add to arc
    arc.stores.push(store);
    return store;
  }
}

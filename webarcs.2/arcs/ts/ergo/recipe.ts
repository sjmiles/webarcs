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
  static normalize(recipe) {
    // TODO(sjmiles): would be great if we normalized all the nodes
    if (Array.isArray(recipe)) {
      recipe = {_: recipe};
    }
    return recipe;
  }
  static parseStores(recipe, stores) {
    recipe = this.normalize(recipe);
    for (const key in recipe) {
      let info = recipe[key];
      if (key === 'particle') {
        this.parseParticle(info, stores);
      } else {
        this.parseSlot(info, stores);
      }
    }
    return stores;
  }
  static parseSlot(info, stores) {
    if (!Array.isArray(info)) {
      info = [info]
    }
   info.forEach(child => this.parseStores(child, stores));
  }
  static parseParticle(spec, stores) {
    if (typeof spec === 'object') {
      //log(`parse:`, spec);
      Object.keys(spec).forEach(key => {
        if (key !== 'kind') {
          let value = spec[key];
          if (typeof value === 'object') {
            value = spec.store || key;
          }
          stores[value] = true;
        }
      });
    }
  }
  //
  static async instantiate(runtime, arc, recipe, container?) {
    recipe = this.normalize(recipe);
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
    //
    // TODO(sjmiles): paralellized process works but is relatively chaotic ...
    // linearize for now to ease understanding. Beware of dependencies on process order
    // creeping in.
    //
    //await Promise.all(info.map(r => this.instantiate(runtime, arc, r, container)));
    for (let child of info) {
      await this.instantiate(runtime, arc, child, container);
    }
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
    let store = arc.stores.find(s => s.id === id);
    if (store) {
      // TODO(sjmiles): hack, fix init sequence properly
      store.changed();
    } else {
      store = this.createStore(runtime, arc, id, spec);
    }
    return store;
  }
  static createStore(runtime, arc: Arc, id, spec) {
    log(`createStore(${id})`);
    const store = new Store(runtime.tenant.id, id);
    const name = spec.store;
    store.name = name;
    // store changes cause host updates
    // TODO(sjmiles): too blunt: this updates all hosts regardless of their interest in this store
    // TODO(sjmiles): `inputs` sent to updateHosts is not the complete set of inputs as may be expected, but
    // instead it's just the latest from here. Hosts accumulate inputs (for better or worse).
    store.listen('set-truth', () => {
      arc.updateHosts(store.pojo);
    });
    // add to context
    runtime.tenant.context.add(store);
    // add to arc
    arc.stores.push(store);
    // TODO(sjmiles): flags at the binding level could conflict (they are n:1)
    // for now, creator wins
    store.shared = spec.share !== false;
    store.volatile = spec.volatile;
    // TODO(sjmiles): we must not `restore()` until after we set `volatile`
    if (!store.restore()) {
      // initialize data
      store.change(data => data[name] = {});
    } else {
      // TODO(sjmiles): pretend we have changed for our new listener
      // instead, perhaps newly added set-truth listeners should automatically be fired
      store.changed();
      //console.warn('... data was initialized via persistence');
    }
    return store;
  }
}

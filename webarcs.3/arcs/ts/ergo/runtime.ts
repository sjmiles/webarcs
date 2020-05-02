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

import {Store} from '../data/store.js';
import {Host, ParticleMeta} from '../core/host.js';
import {Composer} from '../platforms/dom/xen-dom-composer.js';
import {Arc} from '../core/arc.js';
import {Recipe} from './recipe.js';
import {logFactory} from '../utils/log.js';
//import {makeId} from '../utils/id.js';

const log = logFactory(logFactory.flags.ergo, 'runtime', 'magenta');

// expensive, so Highlander
const registry = {};

export class Runtime {
  tenant;
  constructor(tenant) {
    this.tenant = tenant;
  }
  static register(name, factory) {
    registry[name] = factory;
  }
  async createArc(id) {
    const tenant = this.tenant;
    // TODO(sjmiles): maybe runtime should own tenant:
    // - keeps tenant as a POJO
    // - keeps runtime as a class
    // - apis take runtimes
    const root = tenant.composer.root;
    // ?
    tenant.root = root;
    const arcRoot = root.appendChild(document.createElement('div'));
    arcRoot.id = id;
    const composer = new Composer(arcRoot);
    const arc = new Arc({id, composer});
    this.addArc(arc);
    return arc;
  };
  addArc(arc) {
    this.tenant.currentArc = arc;
    this.tenant.arcs[arc.id] = arc;
    //this.persistArcMetas();
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
    this.persistArcMetas();
  }
  realizeStore(arc, id, name?, value?) {
    let store;
    const meta = Store.metaFromId(id);
    if (meta.tags.includes('map')) {
      store = this.mapStore(arc, meta);
      if (!store) {
        log.error('realizeStore: mapStore returned null');
      }
    } else {
      store =this.tenant.context.get(id);
      if (store) {
        log(`realizeStore: using existing store "${id}"`);
      }
      if (!store) {
        store = this.createStore(id, value);
        if (!store) {
          log.error('realizeStore: createStore returned null');
        }
      }
    }
    if (store) {
      // add to context
      this.tenant.context.add(store);
      name = name || meta.name;
      arc.addStore(store, name);
      log(`realizeStore: mapped "${name}" to "${store.id}"`);
    }
  }
  mapStore(arc, meta) {
    let mapped;
    this.tenant.context.forEachStore(store => {
      const sm = store.meta;
      if (sm.type === meta.type && sm.persona === this.tenant.persona) {
        mapped = store;
      }
    });
    log(`spec wants to map "${meta.name}" to "${meta.type}", found ${mapped ? mapped.id : 'nothing'}`);
    return mapped;
  }
  createStore(id, specValue?) {
    log(`createStore(${id})`);
    const store = new Store(this.tenant.id, id);
    //store.spec = spec;
    if (!store.restore()) {
      const value = (specValue !== undefined) ? specValue : (store.isCollection() ? {} : '');
      // initialize data
      store.change(doc => doc.data = value);
    } else {
      // TODO(sjmiles): pretend we have changed for our new listener
      // instead, perhaps newly added set-truth listeners should automatically be fired
      //store.changed();
    }
    return store;
  }
  async createHostedParticle(meta: ParticleMeta) {
    const particle = await this.createParticle(meta.kind);
    if (particle) {
      // TODO(sjmiles): exposing id to the particle is bad for infosec but good for debugging ... study
      particle.id = meta.id;
      return new Host(meta, particle);
    }
    log.error(`failed to create particle "${meta.id}"`);
    return null;
  }
  async createParticle(kind: string): Promise<any> {
    const factory = registry[kind];
    if (factory) {
      return await factory();
    } else {
      log.error(`createParticle: "${kind}" not in registry`);
    }
  }
  async restoreArcMetas() {
    const key = `${this.tenant.id}:arcs`;
    const json = localStorage.getItem(key);
    if (json) {
      //console.log(`restoreArcMetas: "${key}"="${json}"`);
      const metas = JSON.parse(json);
      await Promise.all(metas.map(async ({id, stores, particles}) => {
        const arc = await this.createArc(id);
        for (let meta of stores) {
          this.realizeStore(arc, meta.id, meta.name);
        }
        for (let meta of particles) {
          await arc.addParticle(this, meta);
        }
        arc.updateHosts();
      }));
    }
  }
  persistArcMetas() {
    const json = this.buildArcMetas();
    const key = `${this.tenant.id}:arcs`;
    //console.log(`persistArcMetas: "${key}"="${json}"`);
    localStorage.setItem(key, json);
  }
  buildArcMetas() {
    const metas = [];
    this.forEachArc(({id, hosts, stores}) => {
      metas.push({
        id,
        particles: hosts.map(host => host.meta),
        stores: Object.keys(stores).map(name => ({name, id: stores[name].id}))
      });
    });
    return JSON.stringify(metas, null, '  ');
  }
  forEachArc(task) {
    Object.values(this.tenant.arcs).forEach(arc => task(arc));
  }
};

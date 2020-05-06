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
import {elt} from '../utils/dom.js';

const log = logFactory(logFactory.flags.ergo, 'runtime', 'magenta');

// expensive, so Highlander
const registry = {};

export class Runtime {
  static register(name, factory) {
    registry[name] = factory;
  }
  tenant;
  constructor(tenant) {
    this.tenant = tenant;
  }
  get arcsArray() {
    return Object.values(this.tenant.arcs);
  }
  async createArc(id) {
    const tenant = this.tenant;
    // TODO(sjmiles): maybe runtime should own tenant:
    // - keeps tenant as a POJO
    // - keeps runtime as a class
    // - apis take runtimes
    const root = tenant.root;
    const arcRoot = elt('div', {id}, root);
    const composer = new Composer(arcRoot);
    const arc = new Arc({id, composer});
    this.addArc(arc);
    return arc;
  };
  addArc(arc) {
    this.tenant.currentArc = arc;
    this.tenant.arcs[arc.id] = arc;
  }
  async instantiate(arc: Arc, recipe) {
    await Recipe.instantiate(this, arc, recipe);
    // TODO(sjmiles): must do this after instantiating a recipe so it's here instead of `addArc`, but is seems
    // neither one is correct
    this.persistArcMetas();
  }
  realizeStore(arc, id, extra) {
    let store;
    const meta = Store.metaFromId(id);
    const name = extra.name;
    const tags = `${meta.tags},${extra.tags ? extra.tags.join(',') : ''}`;
    if (tags.includes('map')) {
      store = this.mapStore(arc, meta);
      if (!store) {
        log.error('realizeStore: mapStore returned null');
      } else {
        log(`realizeStore: mapped "${name}" to "${store.id}"`);
      }
    } else {
      store = this.tenant.context.get(id);
      if (store) {
        log(`realizeStore: bound "${name}" to existing store "${id}"`);
      }
      if (!store) {
        store = this.createStore(id, extra);
        if (!store) {
          log.error('realizeStore: createStore returned null');
        }
        log(`realizeStore: bound "${name}" to new store "${id}"`);
      }
    }
    if (store) {
      // add to context
      this.tenant.context.add(store);
      arc.addStore(store, name, extra);
      //log(`realizeStore: bound "${name}" to "${store.id}"`);
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
  createStore(id, extra) {
    log(`[${this.tenant.id}] createStore(${id})`);
    const store = new Store(this.tenant.id, id);
    //store.extra = extra;
    if (!store.restore()) {
      const value = (extra && extra.value !== undefined) ? extra.value : (store.isCollection() ? {} : '');
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
      // TODO(sjmiles): exposing id to the particle is bad for infosec but good for debugging ... consider
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
  // metadata (serialization)
  exportMetadata() {
    return this.arcsArray.map(arc => this.exportArcMetadata(arc));
  }
  exportArcMetadata(arc) {
    const {id, hosts, stores} = arc;
    if (hosts.some(host => !host.meta)) {
      debugger;
    }
    return {
      id,
      particles: hosts.map(host => host.meta),
      stores: Object.keys(stores).map(name => this.exportStoreMetadata(arc, name))
    };
  }
  exportStoreMetadata(arc, name) {
    //log(`exportStoreMetadata: alternate export: `, arc.storeSpecs);
    const id = arc.stores[name].id;
    const extra = arc.extra[name] || {};
    extra.name = name;
    log(`exportStoreMetadata: `, {id, extra});
    return {id, extra};
  }
  async importMetadata(meta) {
    if (meta) {
      await Promise.all(meta.map(meta => this.importArcMetadata(meta)));
    }
  }
  async importArcMetadata({id, stores, particles}) {
    if (this.tenant.arcs[id]) {
      log(`importArcMetadata: Arc ${id} already exists`);
    } else {
      const arc = await this.createArc(id);
      for (let meta of stores) {
        this.realizeStore(arc, meta.id, meta.extra);
      }
      for (let meta of particles) {
        await arc.addParticle(this, meta);
      }
      arc.updateHosts();
    }
  }
  // send/retrieve from persistent storage
  // TODO(sjmiles): delegate to persistor object, or at least ambiguate `localStorage`
  persistArcMetas() {
    const key = `${this.tenant.id}:arcs`;
    const meta = this.exportMetadata();
    const json = JSON.stringify(meta);
    //console.log(`persistArcMetas: "${key}"="${json}"`);
    localStorage.setItem(key, json);
  }
  restoreArcMetas() {
    const key = `${this.tenant.id}:arcs`;
    const json = localStorage.getItem(key);
    //console.log(`restoreArcMetas: "${key}"="${json}"`);
    if (json) {
      return JSON.parse(json);
    }
  }
};

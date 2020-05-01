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
 * @module core
 */

import {EventEmitter} from './event-emitter.js';
//import {Store} from './store.js';
import {Host} from './host.js';
import {debounce} from '../utils/task.js';
import {makeId} from '../utils/id.js';
import {logFactory} from '../utils/log.js';

const renderDebounceIntervalMs = 200;

// TODO(sjmiles): mush the *Nexi into the Arc class

class StoreNexus extends EventEmitter {
  stores = {};
  constructor() {
    super();
  }
  getStoreByName(name) {
    return this.stores[name];
    //return this.stores.find(s => s.name === name);
  }
  forEachStore(task) {
    Object.keys(this.stores).forEach(key => task(this.stores[key], key));
  }
}

class HostNexus extends StoreNexus {
  protected hosts: Host[];
  protected log;
  public id;
  constructor(id) {
    super();
    this.id = id;
    this.hosts = [];
  }
  public onchange() {
  }
  public getHostById(pid) {
    return this.hosts.find(p => p.id === pid);
  }
  public addHost(host) {
    this.hosts.push(host);
  }
  protected updateHost(host) {
    //const hostInputs = this.computeHostInputs(host, inputs);
    this.log(`updateHost(${host.id})`);
    const hostInputs = this.computeHostInputs(host);
    host.requestUpdate(hostInputs);
  }
  // TODO(sjmiles): some data has changed: debounce, collate all data and update (not maximal efficiency)
  // TODO(sjmiles): add debounce (update is debounced, so it's not critical)
  protected computeHostInputs(host) {
    const hostInputs = {};
    const {meta} = host;
    Object.keys(meta).forEach(name => {
      // skip keywords
      // TODO(sjmiles): start with clearer structure (e.g. remove keywords as preprocess)
      if (name !== 'kind' && name !== 'id' && name !== 'container') {
        const storeName = meta[name];
        // find referenced store
        const store = this.getStoreByName(storeName);
        if (!store) {
          this.log.error(`computeHostInputs: "[${storeName}]" (bound to "${name}") not found`)
          return;
        }
        hostInputs[name] = store.pojo.data; //[storeName];
      }
    });
    this.log(`computeHostInputs(${host.id}) = {${Object.keys(hostInputs)}}`);
    // dumping the entire data blob on the console is handy occasionally, but unwieldy most of the time
    //this.log.dir(hostInputs);
    return hostInputs;
  }
  protected mergeOutputs(host, outputs) {
    this.log(`mergeOutputs(${host.id}, ${Object.keys(outputs||0)})`);
    this.forEachStore(store => {
      const {name} = store;
      if (name in outputs) {
        this.log(`mergeOutputs: analyzing "${name}"`);
        const output = outputs[name];
        // TODO(sjmiles): need to formalize what can be in outputs: right here we ignore non-object values
        if (typeof output === 'object' && store.hasChanges({[name]: output})) {
          this.log(`mergeOutputs: "${name}" is dirty, updating Store`);
          store.change(data => data[name] = outputs[name]);
        }
      }
    });
  }
}

/** Arc class */
export class Arc extends HostNexus {
  id;
  private composer;
  constructor({id, composer}) {
    super(id || `arc(${makeId()})`);
    this.log = logFactory(logFactory.flags.arc, `Arc[${id}]`, 'blue') as any;
    this.composer = composer;
    composer.onevent = (pid, eventlet) => this.onComposerEvent(pid, eventlet);
  }
  private onComposerEvent(pid, eventlet) {
    this.log(`[${pid}] sent [${eventlet.handler}] event`, eventlet);
    const host = this.getHostById(pid);
    if (host) {
      host.handleEvent(eventlet);
    }
  }
  addStore(store, name) {
    this.stores[name] = store;
    //arc.stores.push(store);
    // store changes cause host updates
    // TODO(sjmiles): too blunt: this updates all hosts regardless of their interest in this store
    store.listen('set-truth', () => this.updateHosts());
  }
  public async addParticle(runtime, meta) {
    //this.log(`addParticle(${meta.kind}, ${meta.id})`);
    this.log(`addParticle(${JSON.stringify(meta)})`);
    const host = await runtime.createHostedParticle(meta);
    if (host) {
      this.addHost(host);
    }
    return host;
  }
  async addHost(host) {
    super.addHost(host);
    host.onoutput = outputs => this.particleOutput(host, outputs);
  }
  protected particleOutput(host, output) {
    if (output) {
      const {slot, outputs} = output;
      this.log(`particleOutput(${host.id}, {${Object.keys(outputs || Object)}})`);
      // process render-channel output
      if (slot) {
        const model = slot;
        this.debouncedRender(host, model);
      }
      // process data-channel output
      if (outputs) {
        this.mergeOutputs(host, outputs);
      }
    }
  }
  private debouncedRender(host, model) {
    //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
    host._debounceRenderKey =
      debounce(host._debounceRenderKey, () => this.render(host, model), renderDebounceIntervalMs);
  }
  private render(host, model) {
    // TODO(sjmiles): `template` is device-specific; push template logic to the composer
    const {template} = host.config;
    if (template) {
      const {id, container} = host;
      this.composer.render({id, container, content: {template, model}});
    }
  }
  public updateHosts() {
    //this.log(`updateHosts()`);
    this.hosts.forEach((p: Host) => this.updateHost(p));
  }
}
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

class StoreNexus extends EventEmitter {
  stores = [];
  constructor() {
    super();
  }
  getStoreByName(name) {
    return this.stores.find(s => s.name === name);
  }
}

class HostNexus extends StoreNexus {
  protected hosts: Host[];
  protected hnlog;
  public stores;
  public id;
  constructor(id) {
    super();
    this.id = id;
    this.hosts = [];
    this.hnlog = logFactory(logFactory.flags.all, `HostNexus[${this.id}]`, 'green') as any;
  }
  public onchange() {
  }
  public getHostById(pid) {
    return this.hosts.find(p => p.id === pid);
  }
  public addHost(host) {
    this.hosts.push(host);
  }
  protected updateHost(host, inputs) {
    //const hostInputs = this.computeHostInputs(host, inputs);
    this.hnlog(`updateHost(${host.id})`);
    const hostInputs = this.computeHostInputs(host);
    host.requestUpdate(hostInputs);
  }
  // TODO(sjmiles): some data has changed: debounce, collate all data and update (not maximal efficiency)
  // TODO(sjmiles): add debounce (update is debounced, so it's not critical)
  protected computeHostInputs(host) {
    const hostInputs = {};
    const {spec} = host;
    // TODO(sjmiles): start with clearer structure (e.g. lose 'kind' object as preprocess)
    Object.keys(spec).forEach(name => {
      // either 'kind' keyword, or a property name
      if (name !== 'kind') {
        const storeName = spec[name];
        // find referenced store
        const store = this.getStoreByName(storeName);
        if (!store) {
          this.hnlog.error(`computeHostInputs: "[${storeName}]" (bound to "${name}") not found`)
          return;
        }
        hostInputs[name] = store.pojo[storeName];
      }
    });
    this.hnlog.log(`computeHostInputs(${host.id}) =`, JSON.stringify(hostInputs));
    return hostInputs;
  }
  protected mergeOutputs(host, outputs) {
    this.hnlog(`mergeOutputs(${host.id}, ${Object.keys(outputs||0)})`);
    this.stores.forEach(store => {
      const {name} = store;
      if (name in outputs) {
        this.hnlog(`mergeOutputs: analyzing "${name}"`);
        const output = outputs[name];
        // TODO(sjmiles): need to formalize what can be in outputs: right here we ignore non-object values
        if (typeof output === 'object' && store.hasChanges({[name]: output})) {
          this.hnlog(`mergeOutputs: "${name}" is dirty, updating Store`);
          store.change(data => data[name] = outputs[name]);
        }
      }
    });
  }
}

/** Arc class */
export class Arc extends HostNexus {
  id;
  private log;
  private composer;
  constructor({id, composer}) {
    super(id || `arc(${makeId()})`);
    this.log = logFactory(logFactory.flags.all, `Arc[${id}]`, 'blue') as any;
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
  // public async addParticle(runtime, id, spec, container) {
  //   const host = await runtime.createHostedParticle(id, spec, container);
  //   if (host) {
  //     this.addHost(host);
  //   }
  // }
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
  public updateHosts(inputs) {
    this.log(`updateHosts({${Object.keys(inputs)}})`);
    this.hosts.forEach((p: Host) => this.updateHost(p, inputs));
  }
}

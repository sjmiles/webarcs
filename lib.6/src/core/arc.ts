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

import {Store} from './store.js';
import {debounce, deepEqual, makeId} from './utils.js';

const renderDebounceIntervalMs = 200;

/** Arc class */
export class Arc extends Store {
  public id: string;
  public composer;
  public particles: any[];
  /**
  * This method has hierarchical params
  * @param {String} name not used
  * @param {Composer} composer slot composer to use for rendering
  */
  constructor({name, composer}) {
    super(name);
    this.id = `arc(${makeId()})`;
    this.composer = composer;
    composer.onevent = (pid, eventlet) => this.composerEvent(pid, eventlet);
    this.particles = [];
  }
  get serializable() {
    // TODO(sjmiles): convert crdt doc to POJO
    return JSON.parse(JSON.stringify(this.truth));
    //return {...this.truth};
  }
  onchange() {
    // override to listen to mutation events
  }
  update() {
    const inputs = this.serializable;
    console.log(`${this.name}: update(${Object.keys(inputs)})`);
    this.particles.forEach((p: any) => p.doUpdate(inputs));
  }
  async addParticle(runtime, spec, container) {
    // `spec` is just a String for now
    const factory = runtime.registry[spec];
    if (factory) {
      const id = `${this.id}:${spec}(${makeId()})`;
      const onoutput = outputs => this.particleOutput(particle, outputs);
      const particle = await factory(id, onoutput);
      this.particles.push(particle);
      // TODO(sjmiles): this stuff needds to not be on particle, we'll need
      // another map
      particle.id = id;
      particle.container = container;
      particle.onoutput = onoutput;
    }
  }
  particleOutput(particle, outputs) {
    if (outputs) {
      if (typeof outputs !== 'object') {
        console.warn('Arc::particleChanged: `outputs` must be an Object');
      } else {
        // extract render-channel data from outputs
        if (`$slot` in outputs) {
          const model = outputs.$slot;
          // TODO(sjmiles): won't work if `outputs` is frozen, in that case we'll have to create a mutated copy
          delete outputs.$slot;
          this.debouncedRender(particle, model);
        }
        // true if `outputs` has new data
        if (this.mergeRawOutputs(outputs)) {
          this.onchange();
        }
      }
    }
  }
  mergeRawOutputs(outputs) {
    let changed = false;
    this.change(doc => {
      Object.keys(outputs).forEach(key => {
        let value = outputs[key];
        if (value === undefined) {
          // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
          // TODO(sjmiles): we could ignore `undefined` by returning here, which has interesting properties,
          // but I worry it would violate expectations.
          //return;
          value = null;
        }
        const truth = doc[key];
        // TODO(sjmiles): perform potentially expensive dirty-checking here
        // test structures
        if (deepEqual(truth, value)) {
          return;
        }
        doc[key] = value;
        changed = true;
      });
    });
    return changed;
  }
  debouncedRender(particle, model) {
    //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
    particle._debounceRenderKey = debounce(particle._debounceRenderKey, () => this.render(particle, model), renderDebounceIntervalMs);
  }
  render(particle, model) {
    // TODO(sjmiles): `template` is device-specific; push template logic to the composer
    const {template} = particle.config;
    if (template) {
      const {id, container} = particle;
      // because rendering is debounced, be careful using this log to study data-changes
      //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
      this.composer.render({id, container, content: {template, model}});
    }
  }
  composerEvent(pid, eventlet) {
    console.log(`[${pid}] sent [${eventlet.handler}] event`);
    const particle = this.getParticleById(pid);
    if (particle) {
      particle.handleEvent(eventlet);
    }
  }
  getParticleById(pid) {
    return this.particles.find(p => p.id === pid);
  }
};

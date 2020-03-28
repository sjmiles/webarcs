/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Store} from './store.js';
import {debounce, deepEqual} from './utils.js';

export const Arc = class extends Store {
  constructor({name, composer}) {
    super(name);
    this.composer = composer;
    this.particles = [];
  }
  get serializable() {
    return JSON.parse(JSON.stringify(this.truth));
  }
  addParticle(particle) {
    particle.arc = this;
    // TODO(sjmiles): critical override
    particle.onoutput = outputs => this.particleChanged(particle, outputs);
    this.particles.push(particle);
  }
  update() {
    const inputs = this.serializable;
    console.log(`${this.name}: update(${Object.keys(inputs)})`);
    this.particles.forEach(p => p.doUpdate(inputs));
  }
  particleChanged(particle, outputs) {
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
  change(mutator) {
    super.change(mutator);
    this.onchange(this);
  }
  onchange() {
    // override to listen to mutation events
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
    this._debounceRenderKey = debounce(this._debounceRenderKey, () => this.render(particle, model), 100);
  }
  render(particle, model) {
    // TODO(sjmiles): `template` is device-specific; push template logic to the composer
    const {template} = particle.config;
    if (template) {
      const {id, name, container} = this;
      // because rendering is debounced, be careful using this log to study data-changes
      //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
      this.composer.render({id, name, container, content: {template, model}});
    }
  }
};

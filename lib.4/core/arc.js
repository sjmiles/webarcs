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
import {deepEqual} from './utils.js';

export const Arc = class extends Store {
  constructor(name) {
    super(name);
    this.particles = [];
  }
  get serializable() {
    return JSON.parse(JSON.stringify(this.truth));
  }
  addParticle(particle) {
    particle.arc = this;
    particle.output = outputs => this.particleChanged(outputs);
    this.particles.push(particle);
  }
  update() {
    const inputs = this.serializable;
    console.log(`${this.name}: update(${Object.keys(inputs)})`);
    this.particles.forEach(p => p.doUpdate(inputs));
  }
  particleChanged(outputs) {
    if (outputs) {
      if (typeof outputs !== 'object') {
        console.warn('Arc::particleChanged: `outputs` must be an Object');
      } else {
        this.change(doc => {
          Object.keys(outputs).forEach(key => {
            const truth = doc[key];
            const neo = outputs[key];
            if (typeof neo === 'object' && typeof truth === 'object') {
              if (deepEqual(truth, neo)) {
                return;
              }
            }
            doc[key] = outputs[key];
          });
        });
        this.onchange(this);
      }
    }
  }
  change(mutator) {
    super.change(mutator);
    this.onchange(this);
  }
  onchange(store) {
  }
};

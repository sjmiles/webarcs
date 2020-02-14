/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {debounce} from '../core/utils.js';

const debounceIntervalMs = 200;

export const Group = class {
  constructor(owner) {
    this.arcs = [];
    this.changing = false;
    this.changed = [];
    this.owner = owner;
  }
  dispose() {
    this.arcs.forEach(arc => arc.onchange = null);
  }
  addArcs(arcs) {
    this.arcs = this.arcs.concat(arcs);
    arcs.forEach(arc => {
      arc.merge(this.owner.truth);
      arc.onchange = () => this.onchange(arc);
    });
  }
  onchange(arc) {
    if (!this.changed.includes(arc)) {
      this.changed.push(arc);
      this.wakeUp();
    }
  }
  get arcsByName() {
    return this.arcs.map(arc => ({[arc.name]: arc}));
  }
  wakeUp() {
    console.log('debouncing change batch...');
    this.debounce = debounce(this.debounce, () => this.change(), debounceIntervalMs);
  }
  change() {
    console.log('...processing change batch');
    try {
      this.changed.forEach(arc => this.arcChanged(arc));
      this.changed = [];
    } finally {
      this.changing = false;
    }
  }
  arcChanged(arc) {
    //console.groupCollapsed(`${arc.name} changed`);
    //console.log(this.status());
    let changes = arc.changes;
    if (changes.length) {
      this.owner.apply(changes);
      changes = this.owner.changes;
      if (changes.length) {
        this.arcs.forEach(alt => {
          if (alt !== arc) {
            alt.apply(changes);
          }
        });
      }
      console.log(this.status());
    }
    // go again! go again!
    this.arcs.forEach(a => a.dirty && a.update());
    //console.groupEnd();
  }
  status() {
    const ownerTruthJson = JSON.stringify(this.owner.truth);
    const flags = this.arcs.map(arc => `${arc.name}==truth ? ${JSON.stringify(arc.truth) == ownerTruthJson}`);
    return flags.join('; ');
  }
  dump() {
    //const data = [arc0.truth, arc1.truth, persist.truth].map(s => JSON.stringify(s));
    //return `${data[0]}\n${data[1]}\n${data[2]}`;
  }
};

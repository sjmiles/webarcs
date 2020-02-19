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
  addArc(arc) {
    this.arcs.push(arc);
    arc.merge(this.owner.truth);
    arc.onchange = () => this.onchange(arc);
  }
  onchange(arc) {
    if (!this.changed.includes(arc)) {
      console.log(`Group::wakeUp():[${arc.id}] added to changed list`);
      this.changed.push(arc);
      this.wakeUp();
    }
  }
  get arcsByName() {
    return this.arcs.map(arc => ({[arc.name]: arc}));
  }
  wakeUp() {
    console.log('Group::wakeUp(): debouncing change batch...');
    this.debounce = debounce(this.debounce, () => this.change(), debounceIntervalMs);
  }
  change() {
    console.group('Group::change(): ...processing change batch');
    try {
      const changed = this.changed;
      this.changed = [];
      changed.forEach(arc => this.arcChanged(arc));
    } finally {
      this.changing = false;
      console.groupEnd();
    }
  }
  arcChanged(arc) {
    console.log(`Group::[${arc.name}] processing change`);
    //console.groupCollapsed(`${arc.name} changed`);
    //console.log(this.status());
    let changes = arc.changes;
    if (changes.length) {
      console.log(`...applying changes to owner`);
      this.owner.apply(changes);
      console.log('owner', this.owner.toString());
      console.log(`...propagating changes`);
      this.propagateChanges(arc);
    } else {
      console.log(`CHANGE LIST EMPTY`);
    }
    //console.groupEnd();
    this.status();
  }
  propagateChanges(triggeringArc) {
    const changes = this.owner.changes;
    if (changes.length) {
      //const truth = this.owner.toString();
      this.arcs.forEach(alt => {
        if (alt !== triggeringArc) {
          alt.apply(changes);
          console.log(alt.id, alt.toString());
          // if (alt.toString() !== truth) {
          //   console.error('data divergence');
          //   debugger;
          // }
        }
      });
    }
    this.status();
  }
  status() {
    const ownerTruthJson = JSON.stringify(this.owner.truth);
    const flags = this.arcs.map(arc => JSON.stringify(arc.truth) == ownerTruthJson);
    let logs = [];
    let styles = [];
    flags.forEach((flag, i) => {
      logs.push(`${this.arcs[i].name}::%c${flag}%c`)
      styles.push(
        `${flag ? `color: green;` : `color: red; font-weight: bold`}`,
        `color: default; font-weight: default;`
      );
    });
    console.log(`Truth: ${logs.join('; ')}`, ...styles);
  }
  dump() {
    //const data = [arc0.truth, arc1.truth, persist.truth].map(s => JSON.stringify(s));
    //return `${data[0]}\n${data[1]}\n${data[2]}`;
  }
};

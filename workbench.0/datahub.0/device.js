/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Arc} from './arc.js';
import {ArcEnvironment} from './core.js';

import {makeId} from './utils.js';

const idr = () => makeId(2, 2);

export class Device extends ArcEnvironment {
  constructor(id, composer, database) {
    super(id, composer, database);
    this.arcs = {};
    this.id = id;
    this.composer = composer;
    this.database = database;
    //this.reify();
  }
  createArc({id, composer}) {
    id = id || this.makeArcId();
    const arc = new Arc(id, this, composer);
    this.arcs[id] = arc;
    this.persistArcList();
    return arc;
  }
  makeArcId() {
    return `${this.id}:arc(${idr()})`;
  }
  persistArcList() {
    localStorage.setItem(this.id, JSON.stringify(Object.keys(this.arcs)));
  }
  persistData() {
    this.database.persist();
  }
  // reify() {
  //   this.database.reify();
  //   const ids = JSON.parse(localStorage.getItem(this.id));
  //   if (ids) {
  //     ids.forEach(id => this.createArc(id));
  //   }
  // }
};


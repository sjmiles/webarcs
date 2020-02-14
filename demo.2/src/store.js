/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Data} from './data.js';

export class Store extends Data {
  constructor(id) {
    super();
    this.id = id;
  }
  synchronize(arcs) {
    let truth;
    do {
      // extracting changes is destructive
      arcs.forEach(arc => this.apply(arc.changes));
      // extracting changes is destructive
      truth = this.changes;
      if (truth.length) {
        arcs.forEach(arc => arc.apply(truth));
        arcs.forEach(arc => arc.dirty && arc.update());
      }
    } while (truth.length);
    console.log('SYNCHRONIZED');
  }
}

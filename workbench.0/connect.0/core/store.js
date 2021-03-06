
/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {AbstractStore} from './abstract-store.js';
const {Automerge} = window;

export class Store extends AbstractStore {
  constructor(id) {
    super(id);
    this.truth = Automerge.init();
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
    return this;
  }
}


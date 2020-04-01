/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {makeId} from '../utils.js';

export class Collection {
  constructor(data, name) {
    if (!data[name]) {
      data[name] = {};
    }
    this.data = data[name];
  }
  add(item) {
    this.data[makeId()] = item;
  }
}

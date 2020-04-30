/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {EventEmitter} from './event-emitter.js';

class Store extends EventEmitter {
  // abstract low-level synchronizable data-structure
  constructor() {
    super();
  }
}

class Database extends EventEmitter  {
  // - reference a set of Stores
  // - owns network synchronizer
  constructor() {
    super();
  }
}

(async () => {
  const store = new Store();
  const db = new Database();
})();

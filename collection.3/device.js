/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Database} from './database.js';
import {Connection} from './connection.js';

export class Device {
  constructor(id) {
    this.id = id;
    this.db = new Database(`Device(${id})::Database`);
  }
  connect(id) {
    this.connection = new Connection(id, this.db);
    return this.connection;
  }
}

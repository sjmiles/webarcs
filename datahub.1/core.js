/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export class ArcEnvironment {
  constructor(id, composer, database) {
    this.id = id;
    this.composer = composer;
    this.database = database;
  }
}

export class Composer {
  constructor(root) {
    this.root = root;
  }
};

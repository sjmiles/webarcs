/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

 export const Store = class {
  constructor(name) {
    this.name = name;
    this.truth = Automerge.init();
    this.old = this.truth;
  }
  JSON() {
    return JSON.stringify(this.truth);
  }
  toString() {
    //return `[${this.name}]: ${this.JSON()}`;
    return `[${this.name}]: ${Object.keys(this.truth)}`;
  }
  setTruth(truth) {
    this.truth = truth;
    this.update();
  }
  change(mutator) {
    this.truth = Automerge.change(this.truth, mutator);
  }
  apply(changes) {
    this.setTruth(Automerge.applyChanges(this.truth, changes));
  }
  consumeChanges() {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
  update() {
  }
};

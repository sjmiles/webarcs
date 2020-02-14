/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Automerge} from '../../automerge.js';

export class Data {
  constructor() {
    this._truth = Automerge.init();
    this.old = this.truth;
  }
  get truth() {
    return this._truth;
  }
  set truth(truth) {
    this._truth = truth;
  }
  maybeChange(mutator) {
    const applied = this._change(mutator);
    const changes = Automerge.getChanges(this.truth, applied);
    if (changes.length) {
      this.truth = applied;
    }
  }
  change(mutator) {
    this.truth = this._change(mutator);
  }
  _change(mutator) {
    return Automerge.change(this.truth, mutator);
  }
  apply(changes) {
    this.truth = Automerge.applyChanges(this.truth, changes);
  }
  merge(doc) {
    this.truth = Automerge.merge(this.truth, doc);
  }
  get changes() {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
}

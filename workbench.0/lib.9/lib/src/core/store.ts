/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module core
 */

import {Automerge} from '../../../../automerge.js';
import {deepEqual, deepUndefinedToNull} from '../utils/utils.js';

interface AutomergeDocument {}
interface AutomergeChanges {}
type Mutator = (doc: AutomergeDocument) => void;

export class Store {
  public name: string;
  protected truth: AutomergeDocument;
  private old: AutomergeDocument;
  constructor(name: string) {
    this.name = name;
    this.truth = Automerge.init();
    this.old = this.truth;
  }
  toJSON() {
    return JSON.stringify(this.truth);
  }
  toString() {
    return `[${this.name}]: ${Object.keys(this.truth)}`;
  }
  toSerializable() {
    // TODO(sjmiles): convert crdt doc to POJO
    return JSON.parse(JSON.stringify(this.truth));
  }
  protected setTruth(truth: AutomergeDocument) {
    this.truth = truth;
    this.onchange();
  }
  protected onchange() {
  }
  change(mutator: Mutator) {
    this.truth = Automerge.change(this.truth, mutator);
  }
  apply(changes: AutomergeChanges) {
    this.setTruth(Automerge.applyChanges(this.truth, changes));
  }
  consumeChanges(): AutomergeChanges {
    const changes = Automerge.getChanges(this.old, this.truth);
    this.old = this.truth;
    return changes;
  }
  mergeRawData(outputs) {
    let changed = false;
    this.change(doc => {
      Object.keys(outputs).forEach(key => {
        let value = outputs[key];
        if (value === undefined) {
          // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
          value = null;
        }
        const truth = doc[key];
        // TODO(sjmiles): perform potentially expensive dirty-checking here
        if (deepEqual(truth, value)) {
          return;
        }
        // TODO(sjmiles): stopgap: deeply convert undefined values to null
        deepUndefinedToNull(value);
        doc[key] = value;
        changed = true;
      });
    });
    return changed;
  }
};

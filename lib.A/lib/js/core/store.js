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
import { Automerge } from '../../../../automerge.js';
import { deepEqual, deepUndefinedToNull } from '../utils/utils.js';
import { logFactory } from '../utils/log.js';
export class Store {
    constructor(id) {
        this.id = id;
        this.truth = Automerge.init();
        this.old = this.truth;
        this.log = logFactory(logFactory.flags.all, `Store[${id}]`, 'darkolivegreen');
    }
    toJSON() {
        return JSON.stringify(this.truth);
    }
    toString() {
        return `[${this.id}]: ${Object.keys(this.truth)}`;
    }
    // convert crdt doc to POJO
    toSerializable() {
        const pojo = Object.create(null);
        for (let n in this.truth) {
            let value = this.truth[n];
            if (value instanceof Automerge.Table) {
                // strip meta-data off of rows
                value = value.rows.map(r => ({ ...r }));
            }
            pojo[n] = value;
        }
        return pojo;
    }
    setTruth(truth) {
        this.truth = truth;
        this.onchange();
    }
    onchange() {
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
    mergeRawData(outputs) {
        let changed = false;
        this.change(doc => {
            Object.keys(outputs).forEach(key => {
                const truth = doc[key];
                let value = outputs[key];
                //this.log(`mergeRawData: [${key}]:[${typeof value}]`);
                if (truth instanceof Automerge.Table) {
                    this.log(`mergeRawData: [${key}] is a Collection in truth with [${truth.count}] rows`);
                    if (!Array.isArray(value)) {
                        this.log(`mergeRawData: [${key}] output is not an array, aborting`);
                    }
                    this.log(`mergeRawData: [${key}] output has [${value.length}] entries`);
                    const knownIds = truth.map(v => ({ [v.id]: v }));
                    value.forEach((v, i) => {
                        if (!v || !v.id) {
                            this.log(`mergeRawData: value entry [${i}] has no id`);
                        }
                        else {
                            deepUndefinedToNull(v);
                            const row = knownIds[v.id];
                            if (!row) {
                                const id = truth.add(v);
                                this.log(`mergeRawData: adding entry[${id}] to truth`);
                                changed = true;
                            }
                            else {
                                // merge
                            }
                        }
                        ;
                    });
                    //this.log(`mergeRawData: post: [${key}] is a Collection in truth with [${truth.count}] rows`);
                }
                else {
                    // TODO(sjmiles): perform potentially expensive dirty-checking here
                    if (deepEqual(truth, value)) {
                        return;
                    }
                    // downstream APIs, e.g. `automerge` and 'firebase', tend to dislike undefined values
                    if (value === undefined) {
                        value = null;
                    }
                    else {
                        // TODO(sjmiles): stopgap: deeply convert undefined values to null
                        deepUndefinedToNull(value);
                    }
                    doc[key] = value;
                    changed = true;
                }
            });
        });
        return changed;
    }
    createTable(name, schema) {
        if (!this[name]) {
            this.change(doc => {
                doc[name] = new Automerge.Table(schema);
            });
        }
    }
}
;

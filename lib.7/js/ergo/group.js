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
 * @module ergo
 */
import { Arc } from '../core/arc.js';
import { debounce, deepEqual } from '../core/utils.js';
import { logFlags } from '../core/log.js';
const changeDebounceIntervalMs = 100;
export class Group {
    constructor(name, truth) {
        this.name = name;
        this.truth = truth;
        this.arcs = [];
        this.changed = [];
    }
    createArc(args) {
        this.addArc(new Arc(args));
    }
    addArc(arc) {
        arc.onchange = () => this.arcChanged(arc);
        this.arcs.push(arc);
        return arc;
    }
    arcChanged(arc) {
        if (!this.changed.includes(arc)) {
            this.changed.push(arc);
            console.log('debouncing changes', this.changed.length);
            this.changeDebounce = debounce(this.changeDebounce, () => this.processChanged(), changeDebounceIntervalMs);
        }
    }
    processChanged() {
        console.log('--- processing changes ---');
        const local = this.changed;
        this.changed = [];
        let updated = false;
        local.forEach(store => {
            const changes = store.consumeChanges();
            if (changes.length) {
                console.log('updating truth with changes from:', store.name);
                this.truth.apply(changes);
                this.status();
                updated = true;
            }
            else {
                console.log('no-op changes found in:', store.name);
            }
        });
        if (updated) {
            this.sync();
        }
    }
    status() {
        if (logFlags.groupStatus) {
            //console.group('status');
            console.log('status:');
            console.log(this.truth.toString());
            this.arcs.forEach(a => console.log(a.toString()));
            //console.groupEnd();
        }
    }
    truthStatus() {
        const divergent = this.arcs.some(a => {
            deepEqual(a, this.truth);
        });
        if (!divergent) {
            console.log('%ctruth is maintained', 'color: green');
        }
        else {
            console.error('divergence');
            this.status();
        }
    }
    sync() {
        console.log('sync (w/truth)');
        const changes = this.truth.consumeChanges();
        this.arcs.forEach(a => a.apply(changes));
        //this.status();
        this.truthStatus();
    }
}
;

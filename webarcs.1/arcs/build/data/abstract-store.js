/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import { EventEmitter } from '../core/event-emitter.js';
export class AbstractStore extends EventEmitter {
    constructor(id) {
        super();
        this.id = id;
    }
    set truth(truth) {
        if (this._truth !== truth) {
            this._truth = truth;
            this.fire('set-truth');
        }
    }
    get truth() {
        return this._truth;
    }
    get raw() {
        return this._truth;
    }
    serialize(prettyPrint = false) {
        return JSON.stringify(this.raw, null, prettyPrint ? '  ' : null);
    }
    get json() {
        return this.serialize(true);
    }
    get pojo() {
        return JSON.parse(this.serialize());
    }
}

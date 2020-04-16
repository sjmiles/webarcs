/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
//import {Database} from './database.js';
export class Device {
    constructor(spec) {
        this.spec = spec;
        this.id = `${spec.persona}:${spec.device}`;
        console.log(`Device: create %c${this.id}`, 'font-weight: bold; color: blue;');
        //this.context = new Database(`${this.id}:context`);
    }
}

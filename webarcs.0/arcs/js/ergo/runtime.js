/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import { Store } from '../../../core/store.js';
import { logFactory } from '../utils/log.js';
/**
 * @packageDocumentation
 * @module ergo
 */
const log = logFactory(logFactory.flags.ergo, 'runtime', 'purple');
import { Recipe } from './recipe.js';
import { makeId } from '../utils/utils.js';
import { Host } from '../core/host.js';
export class Runtime {
    constructor() {
        this.registry = {};
    }
    register(name, factory) {
        this.registry[name] = factory;
    }
    async instantiate(arc, recipe) {
        await Recipe.instantiate(this, arc, recipe);
    }
    async addParticle(arc, spec, container) {
        const id = `${arc.id}:${spec.kind}(${makeId()})`;
        const particle = await this.createParticle(arc, spec, container);
        particle.id = id;
        if (particle) {
            log(`adding particle ${id}`);
            const host = new Host(id, container, spec, particle);
            arc.addHost(host);
        }
        else {
            log.error(`failed to create particle "${id}" (is the kind registered?)`);
        }
        return particle;
    }
    async createParticle(arc, spec, container) {
        // `spec` is just a String for now
        const factory = this.registry[spec.kind];
        if (factory) {
            return await factory();
        }
    }
    createArcStores(arc) {
        arc.hosts.forEach(host => this.createParticleStores(arc, host));
    }
    createParticleStores(arc, host) {
        Object.keys(host.spec).forEach(key => {
            switch (key) {
                case 'kind':
                    break;
                default: {
                    const store = this.requireStore(arc, host.spec[key]);
                    if (store) {
                        this.device.context.add(store);
                    }
                }
            }
        });
    }
    requireStore(arc, name) {
        const id = `${arc.id}:store:${name}`;
        if (!arc.stores.find(s => s.id === id)) {
            log(`createStore: creating ${id} [${this.device.id}]`);
            const store = new Store(`${arc.id}:store:${name}`);
            store.name = name;
            // store changes cause host updates
            store.listen('set-truth', () => {
                arc.updateHosts(store.pojo);
            });
            // initialize data
            store.change(data => data[name] = {});
            // add to context
            this.device.context.add(store);
            arc.stores.push(store);
            return store;
        }
        else {
            log(`createStore: store ${id} already exists`);
            return null;
        }
    }
}
;

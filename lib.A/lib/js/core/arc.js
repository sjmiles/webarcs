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
import { Store } from './store.js';
import { debounce, makeId } from '../utils/utils.js';
import { logFactory } from '../utils/log.js';
const renderDebounceIntervalMs = 200;
class DataNexus {
    constructor(id) {
        this.id = id;
        //this.docSet = new Automerge.DocSet();
        this.stores = {};
        this.addStore('public');
        this.addStore('private');
    }
    addStore(name) {
        const store = new Store(`${this.id}:store(${name})`);
        store.onchange = () => this.onstoreschange(name);
        //this.docSet.setDoc(store.id, store);
        this.stores[name] = store;
    }
    onstoreschange(name) {
        if (name === 'public') {
            this.onstorechange();
        }
    }
    mergeRawData(store, data) {
        return data && store.mergeRawData(data);
    }
    onstorechange() {
    }
}
class HostNexus extends DataNexus {
    constructor(id) {
        super(id);
        this.hosts = [];
        this.hnlog = logFactory(logFactory.flags.all, `HostNexus[${id}]`, 'green');
    }
    getHostById(pid) {
        return this.hosts.find(p => p.id === pid);
    }
    addHost(host) {
        this.hosts.push(host);
    }
    updateHost(host, inputs) {
        const hostInputs = {};
        // ad-hoc data translation
        Object.keys(host.spec).forEach(name => {
            let sourceName = name;
            const propSpec = host.spec[name];
            // name bindings
            if (typeof propSpec === 'string') {
                sourceName = propSpec;
            }
            // maybe use static value provided in spec
            let value = propSpec.value;
            if (value !== undefined) {
                hostInputs[name] = value;
            }
            // only supply requested inputs
            else if (sourceName in inputs) {
                hostInputs[name] = inputs[sourceName];
            }
        });
        this.hnlog(`updateHost[${host.id}]: inputs are ${JSON.stringify(Object.keys(hostInputs))}`);
        host.requestUpdate(hostInputs);
    }
    mergeOutputs(host, outputs) {
        // ad-hoc data translation
        const privat = {};
        const publik = {};
        Object.keys(outputs).forEach(name => {
            let target = publik;
            let targetName = name;
            const propSpec = host.spec[name];
            if (propSpec) {
                // name bindings
                if (typeof propSpec === 'string') {
                    targetName = propSpec;
                }
                // output distribution
                else if (propSpec.private) {
                    target = privat;
                }
                if (propSpec.collection) {
                    const data = target === publik ? this.stores.public : this.stores.private;
                    if (!data[targetName]) {
                        this.hnlog(`mergeOutputs: creating table [${targetName}]`);
                        data.createTable(targetName, ['id']);
                    }
                }
            }
            target[targetName] = outputs[name];
        });
        if (Object.keys(privat).length) {
            this.hnlog(`mergeOutputs[${host.id}]: produced private data`, Object.keys(privat));
        }
        // `mergeRawData` is true if merging changes the store
        let changed = this.mergeRawData(this.stores.public, publik);
        changed = this.mergeRawData(this.stores.private, privat) || changed;
        if (changed) {
            this.onchange();
        }
    }
    onchange() {
    }
}
/** Arc class */
export class Arc extends HostNexus {
    /**
    * This method has hierarchical params
    * @param {Composer} composer slot composer to use for rendering
    */
    constructor({ composer, id }) {
        super(id || `arc(${makeId()})`);
        this.log = logFactory(logFactory.flags.all, `Arc[${id}]`, 'blue');
        this.composer = composer;
        composer.onevent = (pid, eventlet) => this.onComposerEvent(pid, eventlet);
    }
    onComposerEvent(pid, eventlet) {
        this.log(`[${pid}] sent [${eventlet.handler}] event`, eventlet);
        const host = this.getHostById(pid);
        if (host) {
            host.handleEvent(eventlet);
        }
    }
    // override to listen-to/control mutation events
    onchange() {
        this.update();
    }
    onstorechange() {
        this.update();
    }
    update() {
        const inputs = {
            ...this.stores.public.toSerializable(),
            ...this.stores.private.toSerializable()
        };
        this.log(`update({${Object.keys(inputs)}})`);
        this.hosts.forEach((p) => this.updateHost(p, inputs));
    }
    async addHost(host) {
        super.addHost(host);
        host.onoutput = outputs => this.particleOutput(host, outputs);
    }
    particleOutput(host, output) {
        if (output) {
            const { slot, outputs } = output;
            this.log(`particleOutput('${host.id}', {${Object.keys(outputs || Object)}})`);
            // process render-channel output
            if (slot) {
                const model = slot;
                this.debouncedRender(host, model);
            }
            // process data-channel output
            if (outputs) {
                this.mergeOutputs(host, outputs);
            }
        }
    }
    debouncedRender(host, model) {
        //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
        host._debounceRenderKey =
            debounce(host._debounceRenderKey, () => this.render(host, model), renderDebounceIntervalMs);
    }
    render(host, model) {
        // TODO(sjmiles): `template` is device-specific; push template logic to the composer
        const { template } = host.config;
        if (template) {
            const { id, container } = host;
            this.composer.render({ id, container, content: { template, model } });
        }
    }
}

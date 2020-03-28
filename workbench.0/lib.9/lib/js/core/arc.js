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
const renderDebounceIntervalMs = 200;
// TODO(sjmiles): StoreProxy exists so Arc can express Store interface but delegate the work to
// a polymorphic Store (has-a that looks like is-a). Worth the trouble?
// TODO(sjmiles): answer: no, not worth the trouble.
class StoreProxy {
    constructor(name, onchange) {
        this.store = new Store(name);
        this.store.onchange = onchange;
    }
    get truth() {
        return this.store.truth;
    }
    set truth(truth) {
        this.store.truth = truth;
    }
    change(mutator) {
        this.store.change(mutator);
    }
    apply(changes) {
        this.store.apply(changes);
    }
    consumeChanges() {
        return this.store.consumeChanges();
    }
    toSerializable() {
        return this.store.toSerializable();
    }
    mergeRawData(data) {
        return this.store.mergeRawData(data);
    }
    toString() {
        return this.store.toString();
    }
}
/** Arc class */
export class Arc extends StoreProxy {
    /**
    * This method has hierarchical params
    * @param {Composer} composer slot composer to use for rendering
    */
    constructor({ composer, id }) {
        id = id || `arc(${makeId()})`;
        // TODO(sjmiles): store-change is different from arc-change, make sure not to connect store.onchange to arc.onchange
        super(`${id}:store`, () => this.update());
        this.hosts = [];
        this.id = id;
        this.composer = composer;
        composer.onevent = (pid, eventlet) => this.onComposerEvent(pid, eventlet);
    }
    get name() {
        return this.id;
    }
    // override to listen-to/control mutation events
    onchange() {
        this.update();
    }
    update() {
        const inputs = this.toSerializable();
        console.log(`${this.id}: update({${Object.keys(inputs)}})`);
        this.hosts.forEach((p) => this.updateHost(p, inputs));
    }
    updateHost(host, inputs) {
        host.requestUpdate(inputs);
    }
    async addHost(host) {
        host.onoutput = outputs => this.particleOutput(host, outputs);
        this.hosts.push(host);
    }
    getHostById(pid) {
        return this.hosts.find(p => p.id === pid);
    }
    particleOutput(host, output) {
        if (output) {
            const { slot, outputs } = output;
            console.log(`${this.id}: particleOutput('${host.id}', {${Object.keys(outputs || Object)}})`);
            // process render-channel data
            if (slot) {
                const model = slot;
                this.debouncedRender(host, model);
            }
            // true if merging `outputs` changes `store`
            if (outputs && this.mergeRawData(outputs)) {
                this.onchange();
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
            // because rendering is debounced, be careful using this log to study data-changes
            //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
            this.composer.render({ id, container, content: { template, model } });
        }
    }
    onComposerEvent(pid, eventlet) {
        console.log(`[${pid}] sent [${eventlet.handler}] event`, eventlet);
        const host = this.getHostById(pid);
        if (host) {
            host.handleEvent(eventlet);
        }
    }
}
;

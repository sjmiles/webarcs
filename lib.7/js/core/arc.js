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
import { debounce, makeId } from './utils.js';
const renderDebounceIntervalMs = 200;
/** Arc class */
export class Arc {
    /**
    * This method has hierarchical params
    * @param {Composer} composer slot composer to use for rendering
    */
    constructor({ composer }) {
        this.particles = [];
        this.id = `arc(${makeId()})`;
        this.composer = composer;
        composer.onevent = (pid, eventlet) => this.onComposerEvent(pid, eventlet);
        this.store = new Store(`${this.id}:store`);
        this.store.onchange = () => this.update();
    }
    onchange() {
        // override to listen to mutation events
        this.update();
    }
    update() {
        const inputs = this.store.toSerializable();
        console.log(`${this.id}: update(${Object.keys(inputs)})`);
        this.particles.forEach((p) => p.doUpdate(inputs));
    }
    async addParticle(particle) {
        this.particles.push(particle);
    }
    getParticleById(pid) {
        return this.particles.find(p => p.id === pid);
    }
    particleOutput(particle, output) {
        if (output) {
            const { slot, outputs } = output;
            console.log(`${this.id}: particleOutput(${particle.id}, ${Object.keys(outputs || Object)})`);
            // process render-channel data
            if (slot) {
                const model = slot;
                this.debouncedRender(particle, model);
            }
            // true if merging `outputs` changes `store`
            if (outputs && this.store.mergeRawData(outputs)) {
                this.onchange();
            }
        }
    }
    debouncedRender(particle, model) {
        //console.log(`[${this.id}]::debouncedRender(${JSON.stringify(Object.keys(model || {}))})`);
        particle._debounceRenderKey = debounce(particle._debounceRenderKey, () => this.render(particle, model), renderDebounceIntervalMs);
    }
    render(particle, model) {
        // TODO(sjmiles): `template` is device-specific; push template logic to the composer
        const { template } = particle.config;
        if (template) {
            const { id, container } = particle;
            // because rendering is debounced, be careful using this log to study data-changes
            //console.log(`Host[${id}]::render(${JSON.stringify(model)})`);
            this.composer.render({ id, container, content: { template, model } });
        }
    }
    onComposerEvent(pid, eventlet) {
        console.log(`[${pid}] sent [${eventlet.handler}] event`, eventlet);
        const particle = this.getParticleById(pid);
        if (particle) {
            particle.handleEvent(eventlet);
        }
    }
}
;

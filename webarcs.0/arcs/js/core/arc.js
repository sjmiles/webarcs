/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import { debounce, makeId } from '../utils/utils.js';
import { logFactory } from '../utils/log.js';
const renderDebounceIntervalMs = 200;
class DataNexus {
    //public stores;
    constructor(id) {
        this.id = id;
        // this.stores = {};
        // this.addStore('public');
        // this.addStore('private');
    }
    addStore(name) {
        // const store = new Store(`${this.id}:store(${name})`);
        // store.onchange = () => this.onstoreschange(name);
        // this.stores[name] = store;
    }
    // onstoreschange(name) {
    //   if (name === 'public') {
    //     this.onstorechange();
    //   }
    // }
    mergeRawData(store, data) {
        // return data && store.mergeRawData(data);
    }
}
class HostNexus extends DataNexus {
    constructor(id) {
        super(id);
        this.hosts = [];
        this.hnlog = logFactory(logFactory.flags.all, `HostNexus[${id}]`, 'green');
    }
    onchange() {
    }
    getHostById(pid) {
        return this.hosts.find(p => p.id === pid);
    }
    addHost(host) {
        this.hosts.push(host);
    }
    updateHost(host, inputs) {
        const hostInputs = this.computeHostInputs(host, inputs);
        this.hnlog(`updateHost[${host.id}], {${JSON.stringify(Object.keys(hostInputs))}}`);
        host.requestUpdate(hostInputs);
    }
    mergeOutputs(host, outputs) {
        this.stores.forEach(store => {
            const { name } = store;
            if (outputs[name]) {
                store.change(data => data[name] = outputs[name]);
            }
            //console.warn(host, outputs);
        });
        // const hostOutputs = this.computeHostOutputs(host, outputs);
        // if (Object.keys(hostOutputs.private).length) {
        //   this.hnlog(`mergeOutputs[${host.id}]: produced private data`, Object.keys(hostOutputs.private));
        // }
        // // `mergeRawData` is true if merging changes the store
        // const publicChanged = this.mergeRawData(this.stores.public, hostOutputs.public);
        // const privateChanged = this.mergeRawData(this.stores.private, hostOutputs.private);
        // if (publicChanged || privateChanged) {
        //   this.onchange();
        // }
    }
    computeHostInputs(host, inputs) {
        const hostInputs = {};
        // ad-hoc data translation
        Object.keys(host.spec).forEach(name => {
            // either 'kind' keyword, or a property name
            if (name !== 'kind') {
                const propSpec = host.spec[name];
                // name bindings
                let sourceName = name;
                if (typeof propSpec === 'string') {
                    sourceName = propSpec;
                }
                // maybe use static value provided in spec
                let value = propSpec.value;
                if (value !== undefined) {
                    hostInputs[name] = value;
                }
                else if (sourceName in inputs) {
                    // finally use value from inputs
                    hostInputs[name] = inputs[sourceName];
                }
            }
        });
        return hostInputs;
    }
    // protected computeHostOutputs(host, outputs) {
    //   const hostOutputs = {
    //     private: {},
    //     public: {}
    //   };
    //   Object.keys(outputs).forEach(name => this.computeHostOutputProperty(name, host, outputs, hostOutputs));
    //   return hostOutputs;
    // }
    computeHostOutputProperty(name, host, outputs, hostOutputs) {
        let target = hostOutputs.public;
        let targetName = name;
        let propSpec = host.spec[name];
        if (propSpec) {
            // convert shorthand propSpec to dictionary
            if (typeof propSpec === 'string') {
                propSpec = { target: propSpec };
            }
            // name binding
            if (propSpec.target) {
                targetName = propSpec.target;
            }
            // output distribution
            if (propSpec.private) {
                target = hostOutputs.private;
            }
            // Collection support
            // if (propSpec.collection) {
            //   const data = target === hostOutputs.public ? this.stores.public : this.stores.private;
            //   if (!data[targetName]) {
            //     this.hnlog(`mergeOutputs: creating table [${targetName}]`);
            //     data.createTable(targetName, ['id']);
            //   }
            // }
        }
        target[targetName] = outputs[name];
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
        this.stores = [];
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
        // ...this.stores.public.toSerializable(),
        // ...this.stores.private.toSerializable()
        };
        this.updateHosts(inputs);
    }
    updateHosts(inputs) {
        this.log(`updateHosts({${Object.keys(inputs)}})`);
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

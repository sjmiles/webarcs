/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
export class Particle {
    constructor() {
        this.pendingInputs = Particle.nob();
        this.lastInputs = Particle.nob();
        this.lastState = Particle.nob();
        this._inputs = Particle.nob();
        this._state = this.initialState;
    }
    static nob() {
        return Object.create(null);
    }
    static get html() {
        return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i + 1]}`).join('')}`).trim();
    }
    get initialState() {
        return Particle.nob();
    }
    getProperty(name) {
        return this.pendingInputs[name] || this._inputs[name];
    }
    setProperty(name, value) {
        // dirty checking opportunity
        if (this.validator || this.wouldChangeProp(name, value)) {
            this.pendingInputs[name] = value;
            this.invalidateInputs();
        }
    }
    wouldChangeProp(name, value) {
        return this.wouldChangeValue(this._inputs, name, value);
    }
    wouldChangeState(name, value) {
        return this.wouldChangeValue(this._state, name, value);
    }
    wouldChangeValue(map, name, value) {
        // Important dirty-checking behavior controlled here,
        // can be overridden.
        // The default implementation assumes immutalbe data (e.g. will use strict
        // reference checking, and to modify structured values one must create a
        // new Object to replace the old one.
        return (map[name] !== value);
        // an example of dirty-checking that instead simply punts on structured data
        //return (typeof value === 'object') || (map[name] !== value);
    }
    invalidateInputs() {
        this.inputsInvalid = true;
        this.invalidate();
    }
    setInputs(inputs) {
        // TODO(sjmiles): should be a replace instead of a merge?
        Object.assign(this.pendingInputs, inputs);
        this.invalidateInputs();
    }
    setState(object) {
        let dirty = false;
        const state = this._state;
        for (const property in object) {
            const value = object[property];
            if (this.wouldChangeState(property, value)) {
                dirty = true;
                state[property] = value;
            }
        }
        if (dirty) {
            this.invalidate();
            return true;
        }
    }
    // shorthand for adding state,
    // `this.state = state` is equivalent to `this._setState(state)`
    // Con: weird assignment semantics could surprise devs.
    // Pro: super convenient.
    set state(state) {
        this.setState(state);
    }
    get state() {
        return this._state;
    }
    set inputs(inputs) {
        this.pendingInputs = Particle.nob();
        this.setInputs(inputs);
    }
    get inputs() {
        return this._inputs;
    }
    async(fn) {
        return Promise.resolve().then(fn.bind(this));
    }
    invalidate() {
        if (!this.validator) {
            this.validator = this.async(this.validate);
        }
    }
    getStateArgs() {
        //this._inputs.$oldInputs = this.lastInputs;
        //this._state.$oldState = this.lastState;
        return [this._inputs, this._state]; //, this.lastInputs, this.lastState];
    }
    validate() {
        const stateArgs = this.getStateArgs();
        // try..catch to ensure we nullify `validator` before return
        try {
            // TODO(sjmiles): should be a replace instead of a merge
            Object.assign(this._inputs, this.pendingInputs);
            if (this.inputsInvalid) {
                // TODO(sjmiles): should/can have different timing from rendering?
                //this.willReceiveInputs(...stateArgs);
                this.inputsInvalid = false;
            }
            if (this.shouldUpdate(...stateArgs)) {
                // TODO(sjmiles): consider throttling update to rAF
                this.ensureMount();
                this.doUpdate(...stateArgs);
            }
        }
        catch (x) {
            console.error(x);
        }
        // nullify validator _after_ methods so state changes don't reschedule validation
        this.validator = null;
        // save the old inputs and state
        this.lastInputs = Object.assign(Particle.nob(), this._inputs);
        this.lastState = Object.assign(Particle.nob(), this._state);
    }
    doUpdate(...stateArgs) {
        this.update(...stateArgs);
        this.didUpdate(...stateArgs);
    }
    ensureMount() {
    }
    // willReceiveInputs() {
    // }
    shouldUpdate(...args) {
        return true;
    }
    // update() {
    // }
    didUpdate(...args) {
    }
    // debounce(key, func, delay) {
    //   key = `debounce_${key}`;
    //   this._state[key] = debounce(this._state[key], func, delay != null ? delay : 16);
    // }
    //
    // Above is essentially a `Stateful` class. Below here are the Particle extensions. It's
    // inconvenient to factor the class given current Realms operational restrictions.
    //
    get config() {
        return {
            template: this.template
        };
    }
    // override instance method to listen here
    onoutput(outputs) {
    }
    // subclasses may override
    get template() {
        return null;
    }
    // subclasses may override
    update(inputs) {
        this.output();
    }
    // subclasses may override
    shouldRender(inputs, state) {
        return this.config.template;
    }
    // subclasses may override
    render(inputs, state) {
        return inputs;
    }
    requestUpdate(inputs) {
        this.inputs = inputs;
        this.invalidateInputs();
    }
    // default output performs render merging
    output(outputs) {
        // merge output-model and render-model into a output-packet
        const output = {
            outputs,
            slot: null
        };
        if (this.config.template && this.shouldRender(this.inputs, this.state)) {
            // TODO(sjmiles): presumptively render by including outputs
            const merge = { ...this.inputs, ...outputs };
            // TODO(sjmiles): instead, divide output into channels
            output.slot = this.render(merge, {});
        }
        this.onoutput(output);
    }
    handleEvent({ handler, data }) {
        if (this[handler]) {
            this[handler]({ data });
        }
        else {
            //console.log(`[${this.id}] event handler [${handler}] not found`);
        }
    }
}

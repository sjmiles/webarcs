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

export interface Eventlet {
  handler;
  data;
};

export class Particle {
  private inputs;
  static get html() {
    return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i+1]}`).join('')}`).trim();
  }
  public get config() {
    return {
      template: this.template
    };
  }
  // override instance method to listen here
  public onoutput(outputs?) {
  }
  // subclasses may override
  protected get template() {
    return null;
  }
  // subclasses may override
  protected update(inputs?) {
    this.output();
  }
  // subclasses may override
  public render(inputs) {
    return inputs;
  }
  public requestUpdate(inputs?) {
    this.inputs = inputs;
    this.update(inputs);
  }
  // default output performs render merging
  protected output(outputs?) {
    // merge output-model and render-model into a output-packet
    const output = {
      outputs,
      slot: null
    };
    // TODO(sjmiles): insteadask Particle if it shouldRender instead
    if (this.config.template) {
      // TODO(sjmiles): presumptively render by including outputs
      const merge = {...this.inputs, ...outputs};
      // TODO(sjmiles): instead, divide output into channels
      output.slot = this.render(merge);
    }
    this.onoutput(output);
  }
  public handleEvent({handler, data}: Eventlet) {
    if (this[handler]) {
      this[handler]({data});
    } else {
      //console.log(`[${this.id}] event handler [${handler}] not found`);
    }
  }
};

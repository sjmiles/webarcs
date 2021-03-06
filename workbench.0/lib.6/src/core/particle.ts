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

export class Particle {
  public id: string;
  private inputs: {};
  static get html() {
    return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i+1]}`).join('')}`).trim();
  }
  // subclasses may override
  get template() {
    return null;
  }
  // subclasses may override
  update(inputs?) {
    this.output();
  }
  // subclasses may override
  render(inputs) {
    return inputs;
  }
  protected output(outputs?) {
    if (this.config.template) {
      // TODO(sjmiles): presumptively render by including outputs
      const merge = {...this.inputs, ...outputs};
      outputs = outputs || {};
      // TODO(sjmiles): instead, divide output into channels
      outputs.$slot = this.render(merge);
    }
    this.onoutput(outputs);
  }
  // public calls below here
  get config() {
    return {
      template: this.template
    };
  }
  doUpdate(inputs) {
    //console.log(`${this.id}::doUpdate(${Object.keys(inputs)})`);
    this.inputs = inputs;
    this.update(inputs);
  }
  // override instance method to listen here
  onoutput(outputs?) {
  }
  handleEvent({handler, data}) {
    if (this[handler]) {
      this[handler]({data});
    } else {
      //console.log(`[${this.id}] event handler [${handler}] not found`);
    }
  }
};

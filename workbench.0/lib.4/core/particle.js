/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const Particle = class {
  static get html() {
    return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i+1]}`).join('')}`).trim();
  }
  // for subclasses to override
  get template() {
  }
  // for subclasses to override
  update(/*inputs*/) {
  }
  // subclasses may override
  render(inputs) {
    return inputs;
  }
  // for subclasses to invoke at will
  output(outputs) {
    if (this.template) {
      // TODO(sjmiles): presumptively render by including outputs
      const merge = {...this.inputs, ...outputs};
      // TODO(sjmiles): instead, divide output into channels
      outputs.$slot = this.render(merge);
    }
    this.onoutput(outputs);
  }
  // owner calls below here
  get config() {
    return {
      template: this.template
    };
  }
  doUpdate(inputs) {
    this.inputs = inputs;
    this.update(inputs);
  }
  // owner overrides to listen here
  onoutput(/*outputs*/) {
  }
};

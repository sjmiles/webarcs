/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

'use strict';

const Particle = class {
  static get html() {
    return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i+1]}`).join('')}`).trim();
  }
  get config() {
    return {
      template: this.template
    };
  }
  // Not returned from `render` because templates can be preprocessed and cached. Can we generalize the concept?
  get template() {
    return Particle.html`&nbsp;`;
  }
  requestUpdate(inputs) {
    console.log(`> particle::requestUpdate(${JSON.stringify(Object.keys(inputs || {}))})`);
    const outputs = this.update(inputs);
    if (outputs) {
      this.output(outputs);
      // TODO(sjmiles): presumptively render by including outputs
      const merge = {...inputs, ...outputs};
      const model = this.render(merge);
      this.renderModel(model);
    }
  }
  update(inputs) {
    this.renderModel(this.render(inputs));
  }
  output(outputs) {
    this.hostProxy.output(outputs);
  }
  renderModel(model) {
    console.log(`< particle::renderModel(${JSON.stringify(Object.keys(model || {}))})`);
    this.hostProxy.render(model);
  }
  render(inputs) {
    return inputs;
  }
};

self.Particle = Particle;

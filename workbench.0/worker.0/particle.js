/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const Particle = class {
  static get html() {
    return (strings, ...values) => (`${strings[0]}${values.map((v, i) => `${v}${strings[i+1]}`).join('')}`).trim();
  }
  get config() {
    return {
      template: this.template
    };
  }
  update(inputs) {
    const model = this.render(inputs);
    this.renderModel(model);
    //return outputs;
  }
  // Not returned from `render` because templates can be preprocessed and cached. Can we generalize the concept?
  get template() {
    return Particle.html`&nbsp;`;
  }
  render(inputs) {
    return inputs;
  }
  renderModel(model) {
    this.host.renderModel(model);
  }
};

self.Particle = Particle;

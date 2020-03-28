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
  static get html() {
    return Xen.html;
  }
  update(/*inputs*/) {
    const outputs = {};
    return outputs;
  }
  // Not returned from `render` because templates can be preprocessed and cached. Can we generalize the concept?
  get template() {
    return Xen.html`&nbsp;`;
  }
  render(inputs, /*state*/) {
    return inputs;
  }
}

Particle.registry = {};

Particle.register = (name, clss) => {
  Particle.registry[name] = clss;
};

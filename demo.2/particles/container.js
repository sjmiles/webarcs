/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

self.defineParticle(({Particle}) => class extends Particle {
  get template() {
    return Particle.html`
      <div style="padding: 8px; border: 3px solid blue;">
        <div slot="content"></div>
      </div>
    `;
  }
});

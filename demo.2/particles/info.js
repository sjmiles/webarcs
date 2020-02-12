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
      <div style="padding: 8px;">
        <button on-click="noPushClick">Do Not Push</button>
        <div>Hola <b>{{name}}</b><!--, from <b>{{id}}</b>--></div>
        <div>{{list}}</div>
        <div>{{sorted}}</div>
        <div>{{value}}</div>
      </div>
    `;
  }
  render({name, list, sorted, value}) {
    return {
      name,
      list: JSON.stringify(list),
      sorted,
      value
    };
  }
});

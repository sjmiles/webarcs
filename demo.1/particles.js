/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from './particle.js'

export class Container extends Particle {
  get template() {
    return Particle.html`
      <div style="padding: 8px; border: 3px solid blue;">
        <div slot="content"></div>
      </div>
    `;
  }
}
Particle.register('Container', Container);

export class Info extends Particle {
  get inputs() {
    return ['name', 'list', 'value'];
  }
  get template() {
    return Particle.html`
      <div style="padding: 8px;">
        <button on-click="noPushClick">Do Not Push</button>
        <div>Hola <b>{{name}}</b><!--, from <b>{{id}}</b>--></div>
        <div>{{list}}</div>
        <div>{{value}}</div>
      </div>
    `;
  }
  render({name, list, value}, /*state*/) {
    return {
      //id: this.id,
      name,
      list: JSON.stringify(list),
      value
    };
  }
}
Particle.register('Info', Info);

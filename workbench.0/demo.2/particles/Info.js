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
      <div style="xpadding: 8px;">
        <button on-click="noPushClick">Do Not Push</button><br>
        <br>
        <div>Hola <b>{{name}}</b><!--, from <b>{{id}}</b>--></div>
        <div style="padding: 8px; margin: 8px 0; border: 2px solid silver;">
          <div><span>List: </span><span>{{list}}</span></div>
          <div><span>Sorted: </span><span>{{sortedJson}}</span></div>
        </div>
        <div><span>#</span><span>{{value}}</span></div>
      </div>
    `;
  }
  render({name, list, sortedJson, value}) {
    return {
      name,
      list: JSON.stringify(list, null, ' '),
      sortedJson,
      value
    };
  }
});

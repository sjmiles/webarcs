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
      <div>{{sortedJson}}</div>
    `;
  }
  update({list}) {
    if (list) {
      const sortable = Array.from(list);
      sortable.sort().reverse();
      // returning the array itself caused CRDT sync failure
      // (essentially  `doc.arr = newArray` doesn't seem to work)
      // return JSON so CRDT can operate on it
      return {sortedJson: JSON.stringify(sortable, null, ' ')};
    }
  }
});

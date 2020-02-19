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
  get inputs() {
    return ['list', 'key'];
  }
  update({list, key}) {
    key = key || 'name';
    if (list) {
      list.sort((a, b) => (a[key] < b[key]) ? -1 : (a[key] == b[key]) ? 0 : 1);
    }
    return list;
  }
});

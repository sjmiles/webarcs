/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

(class extends Particle {
  get template() {
    return `<div style="padding: 6px 0;">{{books}}</div>`;
  }
  update() {
    //if (!this.finished) {
      //this.finished = true;
      const books = ['Snails!', 'Dirt is my Friend', 'The Laundry Dilemma'];
      this.output({books});
    //}
  }
});


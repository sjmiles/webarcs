/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

export const particle = ({Particle}) => {

return class extends Particle {
  get template() {
    return Particle.html`
    <div style="padding: 8px;">
      Book Club:
      <pre>{{books}}</pre>
    </div>
    `;
  }
  update() {
    if (!this.finished) {
      this.finished = true;
      const books = ['Owls!', 'Dirt is my Friend', 'The Laundry Dilemma'];
      this.output({books});
    }
  }
  render({books}) {
    return {
      books: books.join('\n')
    };
  }
};

};

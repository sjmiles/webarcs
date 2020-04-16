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

const template = Particle.html`

<style>
  [container] {
    white-space: nowrap;
    overflow-x: scroll;
  }
</style>

<div container>
  <div slot="content"></div>
</div>

`;

return class extends Particle {
  get template() {
    return template;
  }
};

};

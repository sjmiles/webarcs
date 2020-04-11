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
    display: flex;
  }
  [left] {
    flex: 2;
  }
  [right] {
    flex: 1;
  }
</style>

<div container>
  <div left slot="left"></div>
  <div right slot="right"></div>
</div>

`;

return class extends Particle {
  get template() {
    return template;
  }
};

};

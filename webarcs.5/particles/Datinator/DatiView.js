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

const id = digits => {
  return Math.floor(Math.pow(10, digits-1)*2*(Math.random()*4 + 1));
};
const makeId = () => id(4);

const template = Particle.html`

<style>
  :host {
    display: block;
    /* padding: 4px;
    order: 2; */
  }
  /* button {
    padding: 5px;
  } */
  [row] {
    display: flex;
    align-items: center;
    padding: 8px 0;
  }
  [row] > * {
    margin-left: 8px;
  }
</style>

<div row>
  <button on-click="onPrevClick">&lt;</button><span>{{index}}</span><span>of</span><span>{{count}}</span><button on-click="onNextClick">&gt;</button>
</div>

`;

return class extends Particle {
  get template() {
    return template;
  }
  update({}, state) {
    if (state.index === undefined) {
      state.index = 0;
      state.count = 20;
    }
    if (state.index < 0) {
      state.index = 0;
    }
    if (state.index >= state.count) {
      state.index = state.index % state.count;
    }
    // TODO(sjmiles): particles that implement update() can decide whether to render or not;
    // this is generally confusing. The correct usage of 'output()' is unintuitive.
    this.output();
  }
  render({}, state) {
    return {
      count: state.count,
      index: state.index + 1
    };
  }
  onPrevClick() {
    this.state = {index: this.state.index - 1};
  }
  onNextClick() {
    this.state = {index: this.state.index + 1};
  }
};

};

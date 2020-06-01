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
  :host {
    display: flex;
    align-items: center;
  }
  mwc-textfield {
    flex: 1;
  }
</style>

<mwc-textfield label="TV Query" iconTrailing="edit" value="{{value}}" on-change="onInputChange"></mwc-textfield>
`;

return class extends Particle {
  get template() {
    return template;
  }
  update({text}, state) {
    if (state.text !== text) {
      state.text = text;
      state.value = text;
    }
    this.output({text: state.value});
  }
  render({}, state) {
    return state;
  }
  onInputChange({value}) {
    this.state = {value};
  }
  onInputFocus() {
    /**/
  }
};

};

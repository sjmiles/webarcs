/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
export const particle = ({Particle, log}) => {

const id = digits => {
  return Math.floor(Math.pow(10, digits-1)*2*(Math.random()*4 + 1));
};
const makeId = () => id(4);

const template = Particle.html`

<style>
  :host {
    display: block;
    padding: 4px;
  }
  input {
    width: 80%;
  }
</style>

<input on-change="onInputChange" value="{{value}}"><button>Send</button>
`;

return class extends Particle {
  get template() {
    return template;
  }
  render({}, {value}) {
    return {
      value: value || ''
    };
  }
  onInputChange({data: {value: msg}}) {
    if (msg) {
      this.state = {value: ''};
      let {entries, userid} = this.inputs;
      entries = entries || {};
      //log(userid);
      const entry = {
        id: makeId(),
        time: Date.now(),
        msg,
        userid: userid || ''
      };
      entries[entry.id] = entry;
      //const entries = [];
      //entries.push(input.value);
      this.output({entries});
    }
  }
};

};

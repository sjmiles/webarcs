/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {Xen} from '../../xen/xen-async.js';
import {makeId} from '../utils.js';

const template = Xen.html`
<style>
  :host {
    display: block;
    padding: 4px;
  }
  input {
    width: 80%;
  }
</style>
<input on-change="onInputChange"><button>Send</button>
`;

export class ChatWrite extends Xen.Async {
  static get observedAttributes() {
    return ['userid', 'entries'];
  }
  get template() {
    return template;
  }
  onInputChange({currentTarget: input}) {
    const msg = input.value;
    input.value = '';
    const entries = this.props.entries || {};
    const entry = {
      id: makeId(),
      time: Date.now(),
      msg,
      userid: this.props.userid
    };
    entries[entry.id] = entry;
    //const entries = [];
    //entries.push(input.value);
    this.output({entries});
  }
  output(outputs) {
    this.onoutput(outputs);
  }
  onoutput() {
  }
}

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

const template = Xen.html`
<style>
  :host {
    display: block;
    padding: 4px;
  }
  [entries] {
    margin-top: 4px;
  }
</style>
<div entries>{{entries}}</div>
`;

const entryTemplate = Xen.html`
  <pre style="padding: 2px; border: 1px dotted silver; margin: 0;">{{entry}}</pre>
`;

export class ChatRead extends Xen.Async {
  static get observedAttributes() {
    return ['entries'];
  }
  get template() {
    return template;
  }
  render({entries}, {}) {
    // if (entries) {
    //   return {
    //     entries: {
    //       template: entryTemplate,
    //       models: entries.map(entry => ({entry}))
    //     }
    //   };
    // }
  }
};

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
  i {
    font-size: 75%;
  }
</style>
<div entries>{{entries}}</div>
`;

const entryTemplate = Xen.html`
  <pre style="padding: 4px; border: 1px dotted silver; margin: 0;"><i>{{time}}</i> <span>{{entry}}</span></pre>
`;

// const iterate = (collection, renderer, template) => {
//   return !collection ? null : {models: Object.values(collection).map(renderer), template};
// };

export class ChatList extends Xen.Async {
  static get observedAttributes() {
    return ['entries'];
  }
  // constructor() {
  //   super();
  //   this.renderEntries = entries => iterate(entries, this.renderEntry, entryTemplate);
  // }
  get template() {
    return template;
  }
  render({entries}, {}) {
    return {
      entries: entries ? this.renderEntries(entries) : null
    };
  }
  renderEntries(entries) {
    const models = Object.values(entries)
      .sort((a, b) => a.time - b.time)
      .map(this.renderEntry)
      ;
    return {
      template: entryTemplate,
      models
    };
  }
  renderEntry({userid, time, msg}) {
    return {
      time: new Date(time).toLocaleTimeString(),
      entry: `[${userid}] ${msg}`
    };
  }
}

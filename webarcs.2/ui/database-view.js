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

const template = Xen.Template.html`
<style>
  :host {
    display: block;
  }
  div {
    padding: 8px;
    font-size: 12px;
    white-space: pre;
  }
</style>
<div unsafe-html="{{dump}}"></div>
`;

export class DatabaseView extends Xen.Async {
  static get observedAttributes() {
    return ['database'];
  }
  get template() {
    return template;
  }
  update({database}, state) {
    if (database && database !== state.database) {
      if (state.database) {
        state.database.unlisten(state.listener);
      }
      state.database = database;
      state.listener = database.listen('doc-changed', () => this.onDatabaseChange());
    }
  }
  onDatabaseChange() {
    this._invalidate();
  }
  shouldRender({database}) {
    return Boolean(database);
  }
  render({database}) {
    return {dump: database.dump()};
    // const html = [];
    // database.forEachStore(s => html.push(this.renderStore(s)));
    // return {
    //   dump: html.join('')
    // };
  }
  renderStore(store) {
    const html = [];
    html.push(`<b style="font-size:125%;${
        store.shared ? 'color:green;' : ''}">${
        store.id}${
        store.shared ? ' (shared)' : ''}${
        store.isCollection() ? ' (Collection)' : ''}
    </b>\n`);
    const names = Object.keys(store.truth);
    switch (names.length) {
      case 0: {
        // shouldn't happen
        html.push('empty');
      }
      break;
      case 1: {
        const data = store.truth[names[0]];
        if (store.isCollection()) {
          const keys = Object.keys(data);
          html.push(`length: ${keys.length}`);
        } else {
          html.push(data);
        }
      }
      break;
      default: {
        // must be 'peers' which is non-standard
        html.push(store.json);
      }
    }
    html.push(`<hr>`);
    return html.join('');
  }
}

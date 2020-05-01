/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../../xen/xen-async.js';

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
    const html = [];
    database.forEachStore(s => html.push(this.renderStore(s)));
    return {
      dump: html.join('')
    };
  }
  renderStore(store) {
    const html = [];
    const meta = store.getMeta();
    const data = store.getProperty() || false;
    html.push(`<b style="font-size:125%; line-height: 150%;">${meta.name}: ${meta.type}`);
    if (store.isCollection()) {
      html.push(`[${Object.keys(data).length}]`);
    }
    if (store.isShared()) {
      html.push(` <span style="color:green;">(shared)</span>`);
    }
    html.push('</b>');
    html.push(` "${store.id}"`);
    html.push('\n');
    //if (store.isCollection()) {
      html.push(`${JSON.stringify(data, null, '  ')}`);
    //} else {
    //  html.push(`"${data}"`);
    //}
    return `<div style="border-bottom: 1px dotted silver;">${html.join('')}</div>`;
  }
}

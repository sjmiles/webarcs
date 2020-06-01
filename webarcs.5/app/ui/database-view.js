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
import {IconsCss} from '../../../assets/css/icons.css.js';

const template = Xen.Template.html`
<style>
  ${IconsCss}
  :host {
    display: block;
    font-size: 12px;
  }
  [header] {
    padding: 8px 6px;
    display: flex;
    align-items: center;
    font-size:125%;
    line-height: 150%;
    background: var(--ui-bg-4);
  }
  tenant-icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
  icon {
    font-size: 125%;
    margin-right: 8px;
  }
  [store] {
    border-bottom: 1px dotted silver;
  }
  [data] {
    overflow: hidden;
    box-sizing: border-box;
    transition: all 300ms ease-out;
  }
</style>

<div>{{stores}}</div>
`;

const storeTemplate = Xen.Template.html`
  <div store key="{{id}}" on-click="onStoreClick">
    <div header>
      <tenant-icon avatar="{{avatar}}"></tenant-icon>
      <icon xen:style="{{shareStyle}}">{{icon}}</icon>
      <b><span>{{name}}</span></b>: <span>{{type}}</span>
      <span>{{collectionInfo}}</span>
    </div>
    <div data xen:style="{{dataStyle}}">
      <div style="padding: 8px 6px;">
        <div style="text-align: right;">id: <span>{{id}}</span></div>
        <div style="white-space: pre;" unsafe-html="{{data}}"></div>
      </div>
    </div>
  </div>
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
    const models = [];
    database.forEachStore(s => models.push(this.renderStoreModel(s)));
    return {
      stores: {
        template: storeTemplate,
        models
      }
    };
  }
  renderStoreModel(store) {
    const {meta} = store;
    const data = store.getProperty() || {};
    const shared = store.isPublic() || store.wasShared;
    return {
      shareStyle: shared ? `color: green;` : `color: gray;`,
      icon: store.isPublic() ? 'public' : shared ? `cloud_upload` : `cloud_off`,
      owner: meta.persona,
      avatar: `../assets/users/${meta.persona || 'user'}.png`,
      name: meta.name,
      type: meta.type,
      collectionInfo: store.isCollection() ? `[${Object.keys(data).length}]` : '',
      id: store.id,
      dataStyle: store.showData ? {height: null} : {height: '0px'},
      data: data === undefined ? `&lt;empty&gt;` : JSON.stringify(data, null, '  ')
    };
  }
  onStoreClick(e) {
    const id = e.currentTarget.key;
    const store = this.database.get(id);
    if (store) {
      store.showData = !store.showData;
    }
    this._invalidate();
  }
}

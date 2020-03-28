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
import {Store} from '../db/store.js';

const template = Xen.html`
<style>
  :host {
    box-sizing: border-box;
  }
  [outer] {
    overflow: hidden;
    height: 90%;
  }
  [header] {
    background-color: #eeeeee;
    padding: 8px;
    font-size: 1.6em;
  }
  [toolbar] {
    margin: 4px 0;
    display: flex;
    align-items: center;
  }
  [toolbar] > * {
    margin-right: 4px;
  }
  [content] {
    font-size: 9px;
    padding: 8px;
  }
</style>
<div outer xen:style="{{outerStyle}}">
  <div header>
    <div>{{id}}</div>
    <div toolbar>
      <button on-click="onNewArcClick">New Arc</button>
      <button disabled>Other</button>
    </div>
  </div>
  <div>{{arcViews}}</div>
  <div content unsafe-html="{{content}}"></div>
</div>
`;

const arcViewTemplate = Xen.html`
  <arc-view arc="{{arc}}"></arc-view>
`;

export class DeviceView extends Xen.Async {
  static get observedAttributes() {
    return ['device'/*, 'id', 'content'*/];
  }
  get template() {
    return template;
  }
  render({device}) {
    if (device) {
      const html = [];
      device.database.storeIds.forEach(id => {
        const store = device.database.get(id);
        html.push(`<pre>${id} = ${Store.serialize(store)}</pre>`);
      });
      return {
        id: device.id,
        content: html,
        outerStyle: `border: 12px solid ${device.color};`,
        arcViews: {
          template: arcViewTemplate,
          models: Object.values(device.arcs).map(arc => ({arc}))
        }
      };
    }
  }
  // onNewArcClick() {
  //   this.props.device.createArc();
  //   this._invalidate();
  // }
};

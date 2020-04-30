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
import '../../dom-elements/corellia-xen/cx-tabs.js';

const template = Xen.html`
<style>
  :host {
    display: block;
    box-sizing: border-box;
  }
  [outer] {
    overflow: hidden;
    height: 90%;
  }
  [toolbar] {
    display: flex;
    align-items: center;
    height: 38px;
    padding: 4px;
    border-bottom: 1px solid silver;
    background-color: #eeeeee;
  }
  [toolbar] > * {
    margin-right: 8px;
    cursor: pointer;
  }
  [toolbar] > [disabled] {
    color: silver;
  }
  [content] {
    font-size: 9px;
    padding: 8px;
  }
  [banner] {
    background-color: #eeeef8;
    font-size: 110%;
    padding: 8px;
  }
  [arcscontainer] {
    /* border: 2px solid gray; */
  }
</style>
<div outer xen:style="{{outerStyle}}">
  <div banner>{{id}}</div>

  <cx-tabs on-select="onTabSelect">
    <cx-tab selected>Arcs</cx-tab>
    <cx-tab>Database</cx-tab>
  </cx-tabs>

  <div xen:style="{{arcsPageStyle}}">
    <!-- <div banner>Arcs</div> -->
    <div toolbar>
      <!-- <span disabled>Arcs</span> -->
      <button on-click="onNewChatArcClick">New Chat Arc</button>
      <button on-click="onNewChat2ArcClick">New Chat2 Arc</button>
      <button on-click="onNewProfileArcClick">New Profile Arc</button>
      <button disabled>Other</button>
    </div>
    <div arcscontainer>
      <thumb-grid>{{thumbViews}}</thumb-grid>
      <div arcview></div>
    </div>
  </div>

  <div xen:style="{{databasePageStyle}}">
    <!-- <div banner>Database</div> -->
    <div content unsafe-html="{{content}}"></div>
  </div>

</div>
`;

const thumbViewTemplate = Xen.html`
  <thumb-view><arc-view arc="{{arc}}"></arc-view></thumb-view>
`;

export class DeviceView extends Xen.Async {
  static get observedAttributes() {
    return ['device'/*, 'id', 'content'*/];
  }
  _didMount() {
    this.host.querySelector('thumb-grid').bigView = this.host.querySelector('[arcview]');
  }
  get template() {
    return template;
  }
  render({device}, {selected}) {
    let model = {
      arcsPageStyle: `display: ${!selected ? 'block' : 'none'}`,
      databasePageStyle: `display: ${selected === 1 ? 'block' : 'none'}`
    };
    if (device) {
      model = {
        ...model,
        id: device.id,
        content: this.renderDatabaseHtml(device.database),
        thumbViews: this.renderThumbViews(device.arcs),
      };
    }
    return model;
  }
  renderDatabaseHtml(database) {
    const html = [];
    database.storeIds.forEach(id => {
      const store = database.get(id);
      html.push(`<pre>${id} = ${Store.json(store)}</pre>`);
    });
    return html;
  }
  renderThumbViews(arcs) {
    return {
      template: thumbViewTemplate,
      models: Object.values(arcs).map(arc => ({arc}))
    };
  }
  onTabSelect(e) {
    const selected = e.currentTarget.value;
    this.state = {selected};
  }
}

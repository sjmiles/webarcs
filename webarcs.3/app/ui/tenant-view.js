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
  :host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: 16px;
  }
  * {
    box-sizing: border-box;
  }
  [banner] {
    display: flex;
    align-items: center;
    padding: 4px;
    background-color: var(--ui-bg-3);
  }
  [banner] > * {
    margin: 0 8px;
  }
  cx-tabs {
    background-color: var(--ui-bg-4);
    text-transform: uppercase;
    font-size: 14px;
    font-weight: bold;
    color: #888888;
  }
  [tenants] {
    zoom: 0.5;
  }
  [tenants] > * {
    margin: 0 4px;
  }
  [database] > div {
    padding: 8px;
    font-size: 12px;
    white-space: pre;
  }
  [flex] {
    flex: 1;
  }
  [page] {
    display: none;
  }
  [show] {
    display: block;
  }
  [home] {
    padding: 12px;
  }
  /**/
  [arc][show] {
    display: flex;
    align-items: stretch;
  }
  [chooser] {
    width: 120px;
    padding: 8px;
    border: 1px solid var(--ui-bg-3);
    background-color: var(--ui-bg-2);
  }
  [arcItem] {
    display: flex;
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 6px;
    border: 2px solid #eeeeee;
    background-color: #f4f4f4;
    color: #999;
    cursor: pointer;
    user-select: none;
    /* justify-content: center; */
    align-items: center;
  }
  [arcItem][selected] {
    font-weight: bold;
    color: black;
    background-color: white;
    border: 2px solid #ffc107;
  }
  [dot] {
    display: inline-block;
    background-color: lightblue;
    border-radius: 100%;
    width: 16px;
    height: 16px;
    margin: 0 8px;
    visibility: hidden;
  }
  [arcItem][selected] [dot] {
    visibility: visible;
  }
  system-view {
    height: 216px;
    overflow: auto;
  }
  [options] {
    visibility: hidden;
  }
  [arcItem]:hover [options] {
    visibility: visible;
  }
  ${IconsCss}
</style>

<div banner>
  <tenant-icon avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
  <span>{{id}}</span>
  <span flex></span>
  <!-- <span tenants>{{tenants}}</span> -->
  <span tenants>{{connects}}</span>
</div>

<cx-tabs on-select="onTabSelect">
  <!-- <cx-tab>Home</cx-tab> -->
  <cx-tab selected>Arcs</cx-tab>
  <cx-tab>Database</cx-tab>
</cx-tabs>

<div arc page flex show$="{{showArc}}" style="flex-direction: column; overflow: hidden;">
  <div flex style="display: flex; overflow: hidden;">
    <div chooser style="width: 132px; padding: 8px; border: 1px solid var(--ui-bg-3);">{{home}}</div>
    <div flex style="overflow-x: auto; overflow-y: scroll;">
      <!-- actual arcs projected here -->
      <slot></slot>
    </div>
  </div>
  <system-view tenant="{{tenant}}"></system-view>
</div>

<div database page flex show$="{{showDatabase}}" style="overflow: auto;">
  <database-view database="{{database}}"></database-view>
</div>

`;

// const tenantTemplate = Xen.Template.html`
//   <tenant-icon avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
// `;

const connectionTemplate = Xen.Template.html`
  <tenant-icon xen:style="{{style}}" avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
`;

const arcTemplate = Xen.Template.html`
  <div arcItem selected$="{{selected}}" key="{{id}}" on-click="onArcItemClick"><span name>{{id}}</span><span flex></span><icon options style="font-size: 75%;">settings</icon></div>
`;

export class TenantView extends Xen.Async {
  static get observedAttributes() {
    return ['tenant'];
  }
  get template() {
    return template;
  }
  getInitialState() {
    return {
      selectedTab: 0
    };
  }
  update({tenant}, state) {
    // TODO(sjmiles): update periodically as a stopgap for observing changes (e.g. a new arc) ... fix!
    setTimeout(() => this._invalidate(), 500);
    if (tenant && tenant.currentArc) {
      const arc = tenant.currentArc;
      state.selectedArcId = arc.id;
      const root = arc.composer.root;
      if (state.lastRoot !== root) {
        if (state.lastRoot) {
          state.lastRoot.hidden = true;
        }
        state.lastRoot = root;
        root.hidden = false;
      }
    }
  }
  onTabSelect({currentTarget: {value: selected}}) {
    this.state = {selectedTab: selected};
  }
  onArcItemClick({currentTarget: {key}}) {
    if (key) {
      this.state = {selectedArcId: key, selectedTab: 0};
      const {tenant} = this.props;
      const arc = tenant.arcs[key];
      this.selectArc(tenant, arc);
    }
  }
  render({tenant}, {selectedTab, selectedArcId}) {
    return {
      ...tenant,
      //showHome: (selectedTab === 0),
      showArc: (selectedTab === 0),
      showDatabase: (selectedTab === 1),
      database: tenant && tenant.context,
      home: {
        template: arcTemplate,
        models: this.renderHome(tenant, selectedArcId)
      },
      // tenants: {
      //   template: tenantTemplate,
      //   models: tenant && this.renderTenants(tenant)
      // },
      connects: {
        template: connectionTemplate,
        models: tenant && this.renderConnections(tenant)
      },
      tenant
    };
  }
  renderTenants({tenants}) {
    return tenants;
  }
  renderConnections(tenant) {
    return Object.values(tenant.hub.connections).map(conn => {
      const targetId = conn.endpoint.id;
      const {deviceicon, avataricon} = tenant.tenants.find(t => t.id === targetId);
      return {
        deviceicon,
        avataricon,
        style: `border-radius: 100%; border: 3px solid ${conn.endpoint.open ? 'green' : 'red'};`
      };
    });
  }
  renderDatabase(tenant) {
    return `${tenant.context.dump()}`;
  }
  renderHome(tenant, selectedArcId) {
    return Object.keys(tenant.arcs).map(id => ({
      id,
      selected: id === selectedArcId
    }));
  }
  selectArc(tenant, arc) {
    tenant.currentArc = arc;
  }
}

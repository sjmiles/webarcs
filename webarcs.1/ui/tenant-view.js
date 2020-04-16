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
    overflow: auto;
  }
  [show] {
    display: block;
  }
  [home] {
    padding: 12px;
  }
  [arcItem] {
    display: flex;
    padding: 8px;
  }
  [dot] {
    display: inline-block;
    background-color: #ffc107;
    border-radius: 100%;
    width: 16px;
    height: 16px;
    margin: 0 8px;
  }
</style>

<div banner>
  <tenant-icon avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
  <span>{{id}}</span>
  <span flex></span>
  <span tenants>{{tenants}}</span>
</div>

<cx-tabs on-select="onTabSelect">
  <cx-tab>Home</cx-tab>
  <cx-tab selected>Arc</cx-tab>
  <cx-tab>Database</cx-tab>
</cx-tabs>

<div home page flex show$="{{showHome}}">{{home}}</div>
<div arc page flex show$="{{showArc}}"><slot></slot></div>
<div database page flex show$="{{showDatabase}}">
  <div unsafe-html="{{database}}"></div>
</div>
`;

const tenantTemplate = Xen.Template.html`
  <tenant-icon avatar="{{avataricon}}" device="{{deviceicon}}"></tenant-icon>
`;

const arcTemplate = Xen.Template.html`
  <div arcItem><span dot></span><span name>{{name}}</span></div>
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
      selected: 1
    };
  }
  onTabSelect({currentTarget: {value: selected}}) {
    this.state = {selected};
  }
  render({tenant}, {selected}) {
    return {
      ...tenant,
      showHome: (selected === 0),
      showArc: (selected === 1),
      showDatabase: (selected === 2),
      home: {
        template: arcTemplate,
        models: this.renderHome(tenant)
      },
      database: tenant && this.renderDatabase(tenant),
      tenants: {
        template: tenantTemplate,
        models: tenant && this.renderTenants(tenant)
      },
    };
  }
  renderTenants({tenants}) {
    return tenants;
  }
  renderDatabase(tenant) {
    return `${tenant.context.dump()}`;
  }
  renderHome(tenant) {
    return Object.keys(tenant.arcs).map(name => ({name}));
  }
}

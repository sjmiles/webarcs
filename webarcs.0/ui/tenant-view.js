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
    font-size: 16px;
    overflow: hidden;
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
  }
  [tenants] {
    zoom: 0.5;
  }
  [tenants] > * {
    margin: 0 4px;
  }
  [database] {
    padding: 8px;
    font-size: 12px;
    white-space: pre;
  }
  [page] {
    display: none;
    flex: 1;
    overflow: auto;
  }
  [show] {
    display: block;
  }
</style>

<div banner>
  <tenant-icon avatar="{{avatar}}" device="{{device}}"></tenant-icon>
  <span>{{id}}</span>
  <span flex></span>
  <span tenants>{{tenants}}</span>
</div>

<cx-tabs on-select="onTabSelect">
  <cx-tab>Home</cx-tab>
  <cx-tab selected>Arc</cx-tab>
  <cx-tab>Database</cx-tab>
</cx-tabs>

<div page show$="{{showArc}}"><slot></slot></div>
<div page show$="{{showDatabase}}">
  <div database unsafe-html="{{database}}"></div>
</div>
`;

const tenantTemplate = Xen.Template.html`
  <tenant-icon avatar="{{avatar}}" device="{{device}}"></tenant-icon>
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
  render({tenant}, {selected}) {
    return {
      ...tenant,
      tenants: {
        template: tenantTemplate,
        models: this.renderTenants(tenant)
      },
      database: this.renderDatabase(tenant),
      showArc: (selected === 1),
      showDatabase: (selected === 2)
    };
  }
  renderTenants({tenants}) {
    return tenants;
  }
  renderDatabase(tenant) {
    return `${tenant.dev.context.dump()}`;
    //
    // const stores = [];
    // Object.values(tenant.arcs).forEach(arc => {
    //   stores.push(arc.stores.map(store => store.dump()).join('\n'));
    // });
    // return `${tenant.dev.context.dump()}\n${stores.join('')}`;
    //
    // const arcs = Object.keys(tenant.arcs).join(', ');
    // const stores = [];
    // Object.values(tenant.arcs).forEach(arc => {
    //   stores.push(`${arc.id}.stores = [${arc.stores.map(store => store.id).join(', ')}]\n`);
    // });
    // return `${tenant.dev.context.dump()}\n${arcs}\n${stores}`;
  }
  onTabSelect({currentTarget: {value: selected}}) {
    this.state = {selected};
  }
}

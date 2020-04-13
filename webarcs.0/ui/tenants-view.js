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
  * {
    box-sizing: border-box;
  }
  [tenants] {
    line-height: 0;
    padding: 4px 0;
  }
  [tenant] {
    display: block;
    /* border: 1px solid silver; */
    padding: 8px;
    margin: 8px;
    text-align: center;
    /* border: 2px solid transparent; */
  }
  [tenant][selected] {
    /* border: 2px solid lightblue; */
    border-radius: 8px;
    background-color: var(--ui-bg-hi-1);
  }
</style>
<div tenants>{{tenants}}</div>
`;

const tenantTemplate = Xen.Template.html`
  <div tenant selected$="{{selected}}" key="{{i}}" on-click="onTenantClick">
    <tenant-icon avatar="{{avatar}}" device="{{device}}"></tenant-icon>
  </div>
`;

export class TenantsView extends Xen.Async {
  static get observedAttributes() {
    return ['tenants'];
  }
  get template() {
    return template;
  }
  getInitialState() {
    return {selected: 0};
  }
  update({tenants}, {selected}) {
    this.fire('select', tenants[selected]);
  }
  render({tenants}, {selected}) {
    const models = tenants.map(({id, avatar, device}, i) => ({
      i,
      id,
      avatar,
      device,
      selected: i === selected
    }));
    return {
      tenants: {
        template: tenantTemplate,
        models
      }
    };
  }
  onTenantClick(e) {
    const {key} = e.currentTarget;
    this.state = {selected: key};
  }
}

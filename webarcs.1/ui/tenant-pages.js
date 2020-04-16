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
  :host, pages {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
  * {
    box-sizing: border-box;
  }
  tenant-view {
    display: none;
  }
  [show] {
    display: flex;
  }
</style>
<pages>{{tenants}}</pages>
<slot></slot>
`;

const tenantTemplate = Xen.Template.html`
  <tenant-view show$="{{selected}}" tenant="{{tenant}}"></tenant-view>
`;

export class TenantPages extends Xen.Async {
  static get observedAttributes() {
    return ['tenants', 'selected'];
  }
  get template() {
    return template;
  }
  render({tenants, selected}) {
    if (tenants) {
      selected = selected || tenants[0];
      return {
        tenants: {
          template: tenantTemplate,
          models: tenants.map(tenant => ({
            tenant,
            selected: tenant === selected
          }))
        }
      };
    }
  }
  _didRender() {
    // bind each tenant object to a Composer target node
    const {tenants} = this.props;
    if (tenants) {
      const elts = this.host.querySelectorAll('tenant-view');
      tenants.forEach((t, i) => t.view = elts[i]);
    }
  }
}

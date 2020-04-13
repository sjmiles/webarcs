/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {TenantsView} from './tenants-view.js';
import {TenantIcon} from './tenant-icon.js';
import {TenantView} from './tenant-view.js';

window.customElements.define('tenants-view', TenantsView);
window.customElements.define('tenant-icon', TenantIcon);
window.customElements.define('tenant-view', TenantView);

import '../../elements/corellia-xen/cx-tabs.js';

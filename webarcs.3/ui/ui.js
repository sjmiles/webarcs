/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import '../../elements/corellia-xen/cx-tabs.js';

import {TenantsView} from './tenants-view.js';
import {TenantIcon} from './tenant-icon.js';
import {TenantView} from './tenant-view.js';
import {TenantPages} from './tenant-pages.js';
import {SystemView} from './system-view.js';
import {DatabaseView} from './database-view.js';

window.customElements.define('tenants-view', TenantsView);
window.customElements.define('tenant-icon', TenantIcon);
window.customElements.define('tenant-view', TenantView);
window.customElements.define('tenant-pages', TenantPages);
window.customElements.define('system-view', SystemView);
window.customElements.define('database-view', DatabaseView);

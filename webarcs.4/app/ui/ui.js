/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// import 'https://unpkg.com/@material/mwc-textfield@0.15.0/mwc-textfield.js?module';
// import 'https://unpkg.com/@material/mwc-button@0.15.0/mwc-button.js?module';
// import 'https://unpkg.com/@material/mwc-checkbox@0.15.0/mwc-checkbox.js?module';
// import 'https://unpkg.com/@material/mwc-formfield@0.15.0/mwc-formfield.js?module';

// import 'https://unpkg.com/@material/mwc-tab-bar@0.15.0/mwc-tab-bar.js?module';
// import '../../../elements/corellia-xen/cx-tabs.js';

import {TenantsView} from './tenants-view.js';
import {TenantIcon} from './tenant-icon.js';
import {TenantView} from './tenant-view.js';
import {TenantPages} from './tenant-pages.js';
import {SystemView} from './system-view.js';
import {DatabaseView} from './database-view.js';
import {ModalView} from './modal-view.js';
import {ShareSelector} from './share-selector.js';

const define = window.customElements.define.bind(window.customElements);

define('tenant-icon', TenantIcon);
define('tenants-view', TenantsView);
define('tenant-view', TenantView);
define('tenant-pages', TenantPages);
define('system-view', SystemView);
define('database-view', DatabaseView);
define('modal-view', ModalView);
define('share-selector', ShareSelector);

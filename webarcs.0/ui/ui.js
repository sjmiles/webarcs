/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import {PeersView} from './peers-view.js';
import {PeerIcon} from './peer-icon.js';
import {PeerView} from './peer-view.js';

window.customElements.define('peers-view', PeersView);
window.customElements.define('peer-icon', PeerIcon);
window.customElements.define('peer-view', PeerView);

import '../../elements/corellia-xen/cx-tabs.js';

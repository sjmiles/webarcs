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
//import {Store} from '../db/store.js';
//import '../../dom-elements/corellia-xen/cx-tabs.js';

const template = Xen.html`
<style>
  :host {
    display: block;
    border: 1px solid silver;
    padding: 8px;
    margin: 4px;
  }
  pre {
    margin: 0;
  }

</style>

<div><b>{{id}}</b></div><br>
<h4>Connections</h4>
<pre>{{connections}}</pre>
<br>
<h4>Shared</h4>
<pre unsafe-html="{{shares}}"></pre>
`;

export class HubView extends Xen.Async {
  static get observedAttributes() {
    return ['hub'];
  }
  get template() {
    return template;
  }
  update({hub}, state) {
    if (hub && !state.hub) {
      state.hub = hub;
      hub.listen('change', () => this._invalidate());
    }
  }
  render({hub}) {
    if (hub) {
      const connections = JSON.stringify(Object.values(hub.connections).map(c =>
        `${c.endpoint.id}${c.open ? '' : ' (closed)'}`));
      const shares = hub.device.context.dump();
      return {
        id: hub.device.id,
        connections,
        shares
      };
    }
  }
}

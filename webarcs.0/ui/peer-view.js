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
  }
  [peers] {
    zoom: 0.5;
  }
  [peers] > * {
    margin: 0 4px;
  }
  [database] {
    padding: 8px;
  }
  [page] {
    display: none;
  }
  [show] {
    display: block;
  }
</style>

<div banner>
  <peer-icon avatar="{{avatar}}" device="{{device}}"></peer-icon>
  <span>{{id}}</span>
  <span flex></span>
  <span peers>{{peers}}</span>
</div>

<cx-tabs on-select="onTabSelect">
  <cx-tab>Home</cx-tab>
  <cx-tab selected>Arc</cx-tab>
  <cx-tab>Database</cx-tab>
</cx-tabs>

<div page show$="{{showArc}}"><slot></slot></div>
<pre page show$="{{showDatabase}}" database unsafe-html="{{database}}"></pre>
`;

const peerTemplate = Xen.Template.html`
  <peer-icon avatar="{{avatar}}" device="{{device}}"></peer-icon>
`;

export class PeerView extends Xen.Async {
  static get observedAttributes() {
    return ['peer'];
  }
  get template() {
    return template;
  }
  getInitialState() {
    return {
      selected: 1
    };
  }
  render({peer}, {selected}) {
    return {
      ...peer,
      peers: {
        template: peerTemplate,
        models: this.renderPeers(peer)
      },
      database: peer.dev.context.dump(),
      showArc: (selected === 1),
      showDatabase: (selected === 2)
    };
  }
  renderPeers({peers}) {
    return peers;
  }
  onTabSelect({currentTarget: {value: selected}}) {
    this.state = {selected};
  }
}

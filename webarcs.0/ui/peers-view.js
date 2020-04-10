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
  [peers] {
    line-height: 0;
    padding: 4px 0;
  }
  [peer] {
    display: block;
    /* border: 1px solid silver; */
    padding: 8px;
    margin: 8px;
    text-align: center;
    /* border: 2px solid transparent; */
  }
  [peer][selected] {
    /* border: 2px solid lightblue; */
    border-radius: 8px;
    background-color: var(--ui-bg-hi-1);
  }
</style>
<div peers>{{peers}}</div>
`;

const peerTemplate = Xen.Template.html`
  <div peer selected$="{{selected}}" key="{{i}}" on-click="onPeerClick">
    <peer-icon avatar="{{avatar}}" device="{{device}}"></peer-icon>
  </div>
`;

export class PeersView extends Xen.Async {
  static get observedAttributes() {
    return ['peers'];
  }
  get template() {
    return template;
  }
  getInitialState() {
    return {selected: 0};
  }
  update({peers}, {selected}) {
    this.fire('select', peers[selected]);
  }
  render({peers}, {selected}) {
    const models = peers.map(({id, avatar, device}, i) => ({
      i,
      id,
      avatar,
      device,
      selected: i === selected
    }));
    return {
      peers: {
        template: peerTemplate,
        models
      }
    };
  }
  onPeerClick(e) {
    const {key} = e.currentTarget;
    this.state = {selected: key};
  }
}

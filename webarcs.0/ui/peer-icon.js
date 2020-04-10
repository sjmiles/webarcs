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
    display: inline-block;
    line-height: 0;
  }
  * {
    box-sizing: border-box;
  }
  avatar, device {
    display: inline-block;
    border: 3px solid silver;
    border-radius: 50%;
    overflow: hidden;
  }
  avatar > img {
    background-color: white;
    width: 48px;
    height: 48px;
  }
  device {
    margin: -12px 0 0 -12px;
  }
  device > img {
    background-color: white;
    padding: 4px;
    width: 32px;
    height: 32px;
  }
</style>

<avatar><img src="{{avatar}}"></avatar>
<device><img src="{{device}}"></device>
`;

export class PeerIcon extends Xen.Async {
  static get observedAttributes() {
    return ['avatar', 'device'];
  }
  get template() {
    return template;
  }
  render({avatar, device}) {
    return {avatar, device};
  }
}

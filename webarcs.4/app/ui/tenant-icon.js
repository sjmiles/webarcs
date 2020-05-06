/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Xen} from '../../../xen/xen-async.js';

const template = Xen.Template.html`
<style>
  :host {
    position: relative;
    display: inline-flex;
    line-height: 0;
    user-select: none;
    white-space: normal;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    flex-grow: 0;
  }
  * {
    box-sizing: border-box;
  }
  avatar, device {
    display: inline-block;
    border: 3px solid silver;
    border-radius: 50%;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  avatar > img {
    background-color: white;
    width: 100%;
    height: 100%;
  }
  device {
    position: absolute;
    width: 50%;
    height: 50%;
    right: -14px;
    bottom: 0px;
  }
  device > img {
    background-color: white;
    padding: 4px;
    width: 100%;
    height: 100%;
  }
  device[hidden] {
    display: none;
  }
</style>

<avatar><img src="{{avatar}}"></avatar>
<device hidden="{{hideDevice}}"><img src="{{device}}"></device>
`;

export class TenantIcon extends Xen.Async {
  static get observedAttributes() {
    return ['avatar', 'device'];
  }
  get template() {
    return template;
  }
  render({avatar, device}) {
    return {
      avatar,
      device: device || '',
      hideDevice: !device
    };
  }
}

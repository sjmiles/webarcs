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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    background-color: transparent;
    /* opacity: 0.8; */
    /* display: none; */
    z-index: 1000;
  }
  [scrim] {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.8;
    background-color: gray;
    transition: opacity 200ms ease-in-out;
  }
  [container] {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

<div scrim xen:style="{{scrimStyle}}"></div>

<div container xen:style="{{containerStyle}}">
  <slot></slot>
</div>

`;

export class ModalView extends Xen.Async {
  static get observedAttributes() {
    return ['show'];
  }
  get template() {
    return template;
  }
  render({show}) {
    return {
      scrimStyle: {
        opacity: show ? 0.8 : 0
      },
      containerStyle: {
        display: show ? null : 'none'
      }
    };
  }
  _didRender({show}) {
    this.style.pointerEvents = show ?  null : 'none';
    //this.style.display = show ? null : 'none';
  }
}

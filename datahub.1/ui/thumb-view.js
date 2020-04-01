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

const template = Xen.html`
<style>
  :host {
    display: inline-block;
    width: 160px;
    height: 120px;
    overflow: hidden;
    border: 6px solid silver;
    background-color: #eeeeee;
    user-select: none;
  }
  [content] {
    width: 5000px; /* TODO(sjmiles): punted clipping problem */
    height: 100%;
    transform-origin: left top;
    zoom: 0.5;
    pointer-events: none;
  }
</style>

<div content xen:style="{{contentStyle}}">
  <slot>
    <div style="display: flex; width: 320px; height: 100%; align-items: center; justify-content: center; color: #666;"><span>(zoomed)<span></div>
  </slot>
</div>
`;

export class ThumbView extends Xen.Async {
  get template() {
    return template;
  }
  embiggen(target) {
    // w = w || '';
    // h = h || '';
    //this.state = {zoom: 1.0, w, h, display: 'block'};
    //target.appendChild(this);
    //this.style.pointerEvents = null;
    this.child = this.firstElementChild;
    target.appendChild(this.child);
  }
  smallify() {
    // w = w || 160;
    // h = h || 120;
    // this.state = {zoom: 0.5, w, h, display: 'inline-block'};
    // this.style.pointerEvents = 'none';
    this.child = this.child || this.firstElementChild;
    // use memoized smallify target
    //this.container = target || this.container;
    // this.container.appendChild(this);
    this.appendChild(this.child);
  }
  // render(props, {display, w, h, zoom}) {
  //   this.style.width = w ? `${w}px` : '';
  //   this.style.height = h ? `${h}px` : '';
  //   this.style.display = display;
  //   return {
  //     contentStyle: {zoom}
  //   };
  // }
}

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
    overflow: hidden;
    cursor: pointer;
    background-color: white;
  }
  [content] {
    height: 100%;
    transform-origin: left top;
  }
</style>
<div content xen:style="{{contentStyle}}">
  <slot></slot>
</div>
`;

export class ThumbableView extends Xen.Async {
  get template() {
    return template;
  }
  embiggen(target, w, h) {
    w = w || '';
    h = h || '';
    this.state = {zoom: 1.0, w, h, display: 'block'};
    target.appendChild(this);
    this.style.pointerEvents = null;
  }
  smallify(target, w, h) {
    w = w || 160;
    h = h || 120;
    this.state = {zoom: 0.5, w, h, display: 'inline-block'};
    // use memoized smallify target
    target = target || this.container;
    target.appendChild(this);
    this.container = target;
    this.style.pointerEvents = 'none';
  }
  render(props, {display, w, h, zoom}) {
    this.style.width = w ? `${w}px` : '';
    this.style.height = h ? `${h}px` : '';
    this.style.display = display;
    return {
      contentStyle: {zoom}
    };
  }
};

const thumbGridTemplate = Xen.html`
<style>
  :host {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }
  * {
    box-sizing: border-box;
  }
</style>
<slot></slot>
`;

export class ThumbGrid extends Xen.Async {
  get template() {
    return thumbGridTemplate;
  }
  addThumb() {
    const holder = this.appendChild(document.createElement('div'));
    holder.setAttribute('holder', '');
    holder.onclick = e => this.selectThumb(thumb);
    const thumb = document.createElement('thumb-view');
    thumb.setAttribute('thumb', '');
    thumb.smallify(holder);
    return thumb;
  }
  selectThumb = thumb => {
    if (this.bigView && thumb !== this.embiggened) {
      if (this.embiggened) {
        this.embiggened.smallify();
      }
      thumb.embiggen(this.bigView);
      this.embiggened = thumb;
    }
  };
};

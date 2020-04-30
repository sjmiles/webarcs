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

const thumbGridTemplate = Xen.html`
<style>
  :host {
    display: block;
  }
  [container] {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  }
  [container] > * {
    box-sizing: border-box;
    cursor: pointer;
  }
</style>
<div container on-click="onClick">
  <slot on-slotchange="onSlotChange"></slot>
</div>
`;

export class ThumbGrid extends Xen.Async {
  // static get observedAttributes() {
  //   return ['bigview'];
  // }
  constructor() {
    super();
    this.thumbs = [];
  }
  get template() {
    return thumbGridTemplate;
  }
  // addThumb() {
  //   const holder = this.appendChild(document.createElement('div'));
  //   holder.setAttribute('holder', '');
  //   holder.onclick = () => this.selectThumb(thumb);
  //   //
  //   const thumb = document.createElement('thumb-view');
  //   thumb.setAttribute('thumb', '');
  //   //
  //   thumb.smallify(holder);
  //   if (!this.embiggened) {
  //     this.selectThumb(thumb);
  //   }
  //   //
  //   return thumb;
  // }
  selectThumb(thumb) {
    if (this.bigView && thumb !== this.embiggened) {
      if (this.embiggened) {
        this.embiggened.smallify();
      }
      thumb.embiggen(this.bigView);
      this.embiggened = thumb;
    }
  }
  onSlotChange(e) {
    //console.group('onSlotChange');
    const nodes = e.currentTarget.assignedNodes();
    nodes.forEach(thumb => {
      if (thumb.localName === 'thumb-view') {
        if (!this.thumbs.includes(thumb)) {
          this.thumbs.push(thumb);
          thumb.smallify();
          if (!this.embiggened) {
            this.selectThumb(thumb);
          }
        }
      }
    });
    // probably should trim dangling thumbs here too
    //console.groupEnd();
  }
  onClick(e) {
    if (e.target.localName === 'thumb-view') {
      this.selectThumb(e.target);
    }
  }
}

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
    display: block;
    border: 2px solid gray;
    box-sizing: border-box;
    margin: 4px;
  }
  [outer] {
    overflow: hidden;
    height: 90%;
    background-color: #f8f8f8;
  }
  [header] {
    padding: 8px;
    font-size: 1.2em;
  }
  [toolbar] {
    margin: 4px 0;
    display: flex;
    align-items: center;
  }
  [toolbar] > * {
    margin-right: 4px;
  }
  [content] {
    padding: 8px;
    line-height: 110%;
  }
  [output] {
    border: 1px solid silver;
    background-color: white;
  }
  ul {
    margin: 0;
  }
</style>
<div outer xen:style="{{outerStyle}}">
  <div header>
    <div>{{id}}</div>
    <div toolbar>
      <button on-click="onDestroyArcClick">Destroy Arc</button>
      <button disabled>Other</button>
    </div>
  </div>
  <div content unsafe-html="{{content}}"></div>
  <div output></div>
</div>
`;

export class ArcView extends Xen.Async {
  static get observedAttributes() {
    return ['arc'];
  }
  get template() {
    return template;
  }
  render({arc}) {
    if (arc) {
      const html = `<div>Stores:</div><ul>${Object.keys(arc.stores).map(id => `<li>${id}</li>`).join()}</ul>`;
      return {
        id: arc.id,
        content: html
      };
    }
  }
  _didRender({arc}) {
    if (arc) {
      const output = this.host.querySelector('[output]');
      output.appendChild(arc.composer.root);
    }
  }
};

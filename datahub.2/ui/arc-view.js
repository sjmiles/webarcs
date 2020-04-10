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
    box-sizing: border-box;
    margin: 4px;
  }
  [outer] {
    overflow: hidden;
    height: 90%;
    background-color: #f4f4f4;
  }
  [header] {
    padding: 8px;
    font-size: 1.2em;
  }
  [toolbar] {
    margin: 4px 0;
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
  [toolbar] > * {
    margin-right: 4px;
    white-space: nowrap;
  }
  [content] {
    padding: 8px;
    line-height: 140%;
  }
  [small] {
    font-size: 0.8em;
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
    <div><span>{{id}}</span></div>
    <div toolbar>
      <button on-click="onDestroyArcClick">Destroy Arc</button>
      <button disabled>Other</button>
    </div>
  </div>
  <div output></div>
  <!-- <div content small unsafe-html="{{info}}"></div> -->
  <!-- <div content unsafe-html="{{suggestions}}"></div> -->
</div>
`;

export class ArcView extends Xen.Async {
  static get observedAttributes() {
    return ['arc'];
  }
  get template() {
    return template;
  }
  _didRender({arc}) {
    if (arc) {
      arc._view = this;
      const output = this.host.querySelector('[output]');
      output.appendChild(arc.composer.root);
    }
  }
  render({arc}) {
    if (arc) {
      return {
        id: `${arc.meta.recipe || 'Generic'} (#${arc.id})`,
        info: this.renderInfo(arc),
        suggestions: this.renderSuggestions(arc)
      };
    }
  }
  renderInfo(arc) {
    return `<div>Arc Stores:</div><ul>${Object.keys(arc.stores).map(id => `<li>${id}</li>`).join('')}</ul>`;
  }
  renderSuggestions(arc) {
    const suggestions = arc.suggestions || [];
    return `<div>Suggestions:</div><ul>${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>`;
  }
}

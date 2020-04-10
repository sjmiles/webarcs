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
  * {
    box-sizing: border-box;
  }
  [designer] {
    position: relative;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  [toolbar] {
    position: fixed;
    top: 0;
    right: 0;
    height: 32px;
    left: 0;
    padding: 8px;
    display: flex;
    align-items: center;
    background-color: #eeeeee;
  }
  [toolbar-spacer] {
    height: 32px;
  }
  [workspace] {
    /* background-color: #eeeeee; */
    border: 1px solid silver;
    flex: 1;
    display: flex;
  }
  [canvas] {
    flex: 1;
    border: 1px solid silver;
  }
  [palette] {
    width: 400px;
    border: 1px solid silver;
    background-color: #eeeeee;
  }
  [palette] > div {
    margin: 8px 0;
  }
  [selected] {
    outline-offset: -4px;
    outline: 4px dotted black;
  }
  /* @keyframes ants { to { background-position: 100% 100% } }
  [selected] {
    outline: 1px solid transparent;
    background: linear-gradient(white, white) padding-box,
                repeating-linear-gradient(-45deg, black 0, black 25%, transparent 0, transparent 50%) 0 / .6em .6em;
    animation: ants 6s linear infinite;
  } */
</style>
<div designer>
  <div toolbar>
    <span>Arcinator</span>
  </div>
  <div toolbar-spacer></div>
  <div workspace>
    <div canvas on-click="onCanvasClick"></div>
    <div palette>
      <div style="display: flex; flex-direction: column;">
        <button on-click="onAddDivClick">Add</button>
      </div>
      <div>
        <button on-click="onSelectRootClick">Select Root</button>
      </div>
      <div style="display: flex; flex-direction: column; white-space: nowrap;">
        <div style="display: flex;">style: <input style="flex: 1;" on-change="onStyleChange" value="{{styleValue}}"></div>
      </div>
    </div>
  </div>
</div>
`;

export class ArcDesigner extends Xen.Async {
  get template() {
    return template;
  }
  update() {
  }
  render({}, {selected}, {}, {selected: oldSelected}) {
    let model = {};
    if (oldSelected) {
      oldSelected.removeAttribute('selected');
    }
    if (selected) {
      selected.setAttribute('selected', '');
      model = {...model,
        styleValue: selected.style.cssText
      };
    }
    return model;
  }
  onAddDivClick() {
    const container = this.state.selected || this.host.querySelector('[canvas]');
    const elt = container.appendChild(document.createElement('div'));
    elt.style.cssText = 'border: 4px solid magenta; padding: 8px;';
    elt.innerText = 'Element';
    this.state = {
      selected: elt
    };
  }
  onStyleChange({currentTarget: {value}}) {
    if (this.state.selected) {
      this.state.selected.style.cssText = value;
      this._invalidate();
    }
  }
  onSelectRootClick() {
    this.state = {
      selected: null
    };
  }
  onCanvasClick({currentTarget, target}) {
    if (target !== currentTarget) {
      this.state = {
        selected: target
      };
    }
  }
}

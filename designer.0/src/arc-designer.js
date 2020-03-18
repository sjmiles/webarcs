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
    width: 200px;
    border: 1px solid silver;
    background-color: #eeeeee;
  }
</style>
<div designer>
  <div toolbar>
    <span>Arcinator</span>
  </div>
  <div toolbar-spacer></div>
  <div workspace>
    <div canvas></div>
    <div palette></div>
  </div>
</div>
`;

export class ArcDesigner extends Xen.Async {
  get template() {
    return template;
  }
};

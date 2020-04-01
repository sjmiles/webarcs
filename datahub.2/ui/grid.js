/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {ThumbGrid} from './thumb-grid.js';
import {ThumbView} from './thumb-view.js';

window.customElements.define('thumb-view', ThumbView);
window.customElements.define('thumb-grid', ThumbGrid);

window.thumbsGrid.bigView = window.mainView;


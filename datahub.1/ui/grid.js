/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {ThumbableView, ThumbGrid} from './thumb-view.js';

window.customElements.define('thumb-view', ThumbableView);
window.customElements.define('thumb-grid', ThumbGrid);

export const addThumb = () => {
  thumbsGrid.bigView = mainView;
  return thumbsGrid.addThumb();
};

window.testGrid = () => {
  for (let i=0; i<10; i++) {
    const thumb = addThumb();
    thumb.content.innerHTML = `Hey Yo, #${i}!`;
  }
};

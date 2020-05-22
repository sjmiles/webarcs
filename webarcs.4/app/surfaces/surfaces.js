/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {XenSurface} from '../../arcs/build/platforms/dom/xen-surface.js';

export class Surfaces {
  constructor() {
    this.surfaces = {};
  }
  normalizeModality(modality) {
    switch (modality) {
      case 'xr':
      case 'ar':
      case 'vr':
        modality = 'ar';
        break;
      default:
        modality = 'xen';
        break;
    }
    return modality;
  }
  async requestSurface(name, container) {
    name = this.normalizeModality(name);
    // provide cached version in case Surface supports multiple arcs
    let surface = this.surfaces[name];
    // acquire surface (with option to reuse cached instance)
    surface = await this.waitForRenderSurface(surface, name, container);
    this.surfaces[name] = surface;
    return surface;
  }
  async waitForRenderSurface(surface, name, container) {
    return await this.createRenderSurface(surface, name, container);
  }
  async createRenderSurface(surface, name, container) {
    switch(name) {
      case 'xen':
        return surface || createInprocessXenSurface(container);
      default:
        return await createRemoteSurface(name);
    }
  }
}

const createInprocessXenSurface = container => {
  return new XenSurface(container, true); // second param enables shadow-root
};

const createRemoteSurface = async name => {
  const win = open(`./app/surfaces/${name}.html`, `` /*`${name}::Arcs`*/, 'resizable=1, scrollbars=1');
  // TODO(sjmiles): should wait for explicit signal, but this is MVP
  await new Promise(resolve => setTimeout(resolve, 5000));
  const {surface} = win;
  if (surface) {
    surface.win = win;
  }
  return surface;
};

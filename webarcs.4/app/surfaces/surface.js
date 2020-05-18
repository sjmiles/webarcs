/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const surfaces = {};

export const requestSurfaceComposer = async name => {
  let surface = surfaces[name];
  if (!surface) {
    // acquire surface
    surface = await waitForRenderSurface(name);
    surfaces[name] = surface;
  }
  // acquire composer
  const {composer} = surface;
  return composer;
};

export const waitForRenderSurface = async name => {
  const surface = createRenderSurface(name);
  // TODO(sjmiles): could wait for explicit signal, but this is MVP
  await new Promise(resolve => setTimeout(resolve, 1000));
  return surface;
};

const createRenderSurface = name => {
  return open(`./app/surfaces/${name}.html`, `${name}::Arcs`, 'resizable=1, scrollbars=1');
};

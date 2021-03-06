/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Runtime} from '../../lib/js/ergo/runtime.js';
import {realmsParticle} from '../../lib/js/devices/realms/realms.js';

const particles = [
  'Noop',
  'Scroller',
  'Columns',
  'Container',
  'Info',
  'Sorter',
  'Books',
  'TMDBSearch',
  'TMDBGrid',
  'TMDBDetail'
];

export const initContext = async () => {
  const runtime = new Runtime();
  const promises = particles.map(async p => runtime.register(p, await realmsParticle(p)));
  await Promise.all(promises);
  return runtime;
};

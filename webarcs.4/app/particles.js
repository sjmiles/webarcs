/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Runtime} from '../arcs/build/ergo/runtime.js';
import {realmsParticle} from '../arcs/build/platforms/realms/realms.js';

const particles = [
  'Noop',
  'Scroller',
  'Frame',
  'Columns',
  'Container',
  'TextInput',
  'Info',
  'Sorter',
  'Books',
  'TMDBSearch',
  'TMDBGrid',
  'TMDBDetail',
  'Chat/ChatList',
  'Chat/ChatWrite',
  'Xr/Dino',
  'Xr/Marker',
  'Xr/Hue',
];

export const initParticles = async () => {
  const promises = particles.map(async p => Runtime.register(p, await realmsParticle(p)));
  await Promise.all(promises);
};

/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Runtime} from '../../js/ergo/runtime.js';
import {realmsParticle} from '../../js/devices/realms/realms.js';

export const initContext = async (/*noworker*/) => {
  console.time('initContext');

  const runtime = new Runtime();

  runtime.register('Noop', await realmsParticle('Noop'));
  runtime.register('Scroller', await realmsParticle('Scroller'));
  runtime.register('Columns', await realmsParticle('Columns'));
  runtime.register('Container', await realmsParticle('Container'));

  runtime.register('Info', await realmsParticle('Info'));
  runtime.register('Sorter', await realmsParticle('Sorter'));
  runtime.register('Books', await realmsParticle('Books'));

  runtime.register('TMDBSearch', await realmsParticle('TMDBSearch'));
  runtime.register('TMDBGrid', await realmsParticle('TMDBGrid'));
  runtime.register('TMDBDetail', await realmsParticle('TMDBDetail'));

  runtime.register('Realms.Books', realmsParticle('Books'));

  console.timeEnd('initContext');

  return runtime;
};

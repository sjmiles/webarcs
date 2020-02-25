/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Runtime} from '../js/ergo/runtime.js';

import {Unbus} from '../js/devices/unbus.js';
import {createHostedParticle} from '../js/devices/host.js';
import {WorkerHub} from '../js/devices/worker/worker-hub.js';
import {realmsParticle} from '../js/devices/realms/realms.js';
import {importParticle, literalParticle} from '../js/devices/es/es.js';

import {Noop} from '../particles/raw/Noop.js';
import {Recipes} from '../particles/raw/Recipes.js';
import {Sorter} from '../particles/raw/Sorter.js';
import {TMDBSearch} from '../particles/raw/TMDBSearch.js';
import {TMDBDetail} from '../particles/raw/TMDBDetail.js';

export const initContext = async () => {
  console.time('initContext');

  const runtime = new Runtime();

  // simple main-thread particles
  runtime.register('Noop', literalParticle(Noop));
  runtime.register('Sorter', literalParticle(Sorter));
  runtime.register('TMDBSearch', literalParticle(TMDBSearch));
  runtime.register('TMDBDetail', literalParticle(TMDBDetail));

  // dynamic main-thread particles
  runtime.register('Books', await importParticle('Books'));
  runtime.register('Columns', await importParticle('Columns'));
  runtime.register('TMDBGrid', await importParticle('TMDBGrid'));
  runtime.register('Scroller', await importParticle('Scroller'));

  // unbus particles
  runtime.register('UnbusBooks', async (id, container) => await createHostedParticle(id, Recipes, container, new Unbus()));

  // WorkerHub particles
  WorkerHub.init();
  runtime.register('Container', await WorkerHub.importParticle('Container'));
  runtime.register('Info', await WorkerHub.importParticle('Info'));

  // realms particles
  runtime.register('Realms.Books', realmsParticle('Books'));

  console.timeEnd('initContext');

  return runtime;
};

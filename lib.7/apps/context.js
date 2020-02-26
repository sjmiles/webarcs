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

import {Recipes} from '../particles/raw/Recipes.js';

export const initContext = async (noworker) => {
  console.time('initContext');

  const runtime = new Runtime();

  // simple main-thread particles
  runtime.register('Recipes', literalParticle(Recipes));

  // dynamic main-thread particles
  runtime.register('Noop', await importParticle('Noop'));
  runtime.register('Scroller', await importParticle('Scroller'));
  runtime.register('Columns', await importParticle('Columns'));
  //
  runtime.register('Sorter', await importParticle('Sorter'));
  runtime.register('Books', await importParticle('Books'));
  //
  runtime.register('TMDBSearch', await importParticle('TMDBSearch'));
  runtime.register('TMDBGrid', await importParticle('TMDBGrid'));
  runtime.register('TMDBDetail', await importParticle('TMDBDetail'));

  // unbus particles
  runtime.register('UnbusRecipes', async () => await createHostedParticle(Recipes, new Unbus()));

  // WorkerHub particles
  if (!noworker) {
    WorkerHub.init();
    runtime.register('Container', await WorkerHub.importParticle('Container'));
    runtime.register('Info', await WorkerHub.importParticle('Info'));
  }

  // realms particles
  runtime.register('Realms.Books', realmsParticle('Books'));

  console.timeEnd('initContext');

  return runtime;
};

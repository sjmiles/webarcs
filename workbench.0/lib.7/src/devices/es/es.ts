/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Particle} from '../../core/particle.js';

const root = '../../../particles';
const registry = {};

export const literalParticle = particleClass => {
  return async () => new particleClass();
}

const requireParticleFactory = async kind => {
  let factory = registry[kind];
  if (!factory) {
    factory = (await import(`${root}/${kind}.js`)).particle;
    registry[kind] = factory;
  }
  return factory;
}

export const importParticle = async kind => {
  const factory = await requireParticleFactory(kind);
  return async () => await createImportParticle(factory)
};

const injections = {
  fetch,
  log: (...stuff) => console.log(`[$Particle]:`, ...stuff)
};

const createImportParticle = async (factory) => {
  return new (factory({Particle, ...injections}))();
};

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

const requireParticleFactory = async name => {
  let factory = registry[name];
  if (!factory) {
    factory = (await import(`${root}/${name}.js`)).particle;
    registry[name] = factory;
  }
  return factory;
}

export const importParticle = async name => {
  const factory = await requireParticleFactory(name);
  return async (id, container) => await createImportParticle(factory, id, container)
};

// export const registerImportParticle = async (runtime, name) => {
//   const factory = await requireParticleFactory(name);
//   runtime.register(name, async (id, container) => await createImportParticle(factory, id, container));
// };

export const createImportParticle = async (factory, id, container) => {
  const instance = new (factory({Particle}))();
  // TODO(sjmiles): need a host concept to own privileged particle data
  instance.id = id;
  instance.$container = container;
  return instance;
};

export const literalParticle = clss => {
  return async () => new clss();
}

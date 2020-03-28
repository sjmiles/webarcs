/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import Realm from '../../../../realms-shim.esm.js'

let root;
let particle;

const requireRealm = () => {
  return root || (root = Realm.makeRootRealm());
};

const makeCompartment = () => {
  return Realm.makeCompartment();
};

const requireParticle = async () => {
  return particle || (particle = await (await fetch('./src/devices/realms/particle.js')).text());
};

// factory for import particles
export const createRealmsParticle = async (factory, id, container) => {
  //const realm = requireRealm();
  const compartment = makeCompartment();
  const base = await requireParticle();
  const Particle = compartment.evaluate(`${base}`);
  const implCode = await (await fetch('./particles.realms/Books.js')).text();
  console.log(implCode);
  const Impl = compartment.evaluate(`${implCode}`, {Particle});
  const particle = new Impl();
  // TODO(sjmiles): need a host concept to own privileged particle data
  particle.id = container;
  particle.$container = container;
  return particle;
};

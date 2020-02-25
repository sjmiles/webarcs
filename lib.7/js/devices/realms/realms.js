/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import Realm from '../../../../realms-shim.esm.js';
let particleSource;
const makeCompartment = () => {
    return Realm.makeCompartment();
};
const requireParticle = async () => {
    return particleSource || (particleSource = `(${await (await fetch('../../particles/realms/particle.js')).text()})`);
};
export const realmsParticle = name => {
    return async (id, container) => await createRealmsParticle(name, id, container);
};
// factory for import particles
const createRealmsParticle = async (name, id, container) => {
    const compartment = makeCompartment();
    const baseCode = await requireParticle();
    const Particle = compartment.evaluate(`${baseCode}`);
    const implCode = await (await fetch(`../../particles/realms/${name}.js`)).text();
    //console.log(implCode);
    const Impl = compartment.evaluate(`${implCode}`, { Particle });
    const particle = new Impl();
    // TODO(sjmiles): need a host concept to own privileged particle data
    particle.id = id;
    particle.$container = container;
    return particle;
};

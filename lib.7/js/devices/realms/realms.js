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
    if (!particleSource) {
        let moduleText = await (await fetch('../../js/core/core-particle.js')).text();
        // TODO(sjmiles): gross
        const preamble = moduleText.indexOf('class Particle');
        moduleText = moduleText.slice(preamble, -2);
        particleSource = `(${moduleText})`;
        //console.log(particleSource);
    }
    //return particleSource || (particleSource = `(${await (await fetch('../../particles/realms/particle.js')).text()})`);
    return particleSource;
};
export const realmsParticle = name => {
    return async (id, container) => await createRealmsParticle(name, id, container);
};
// factory for import particles
const createRealmsParticle = async (name, id, container) => {
    const compartment = makeCompartment();
    const baseCode = await requireParticle();
    const Particle = compartment.evaluate(`${baseCode}`);
    let implCode = await (await fetch(`../../particles/${name}.js`)).text();
    // TODO(sjmiles): gross #2
    implCode = implCode.slice(implCode.indexOf('('));
    //console.log(implCode);
    const impl = compartment.evaluate(`${implCode}`, { Particle });
    const ctor = impl({ Particle });
    const particle = new ctor();
    // TODO(sjmiles): need a host concept to own privileged particle data
    particle.id = id;
    particle.$container = container;
    return particle;
};

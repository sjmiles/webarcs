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
const createSafeFn = (realm, fn) => {
    const safer = `
    (function safeFnFactory(unsafe) {
      return function safe(...args) {
        return unsafe(...args);
      }
    })
  `;
    const safeFnFactory = realm.evaluate(safer);
    // Create a safe function
    return safeFnFactory(fn);
};
const packageSafeFns = (realm, fns) => {
    const fnpackage = {};
    Object.keys(fns).forEach(key => {
        fnpackage[key] = createSafeFn(realm, fns[key]);
    });
    return fnpackage;
};
const requireParticleBaseCode = async () => {
    if (!particleSource) {
        let moduleText = await (await fetch('../../js/core/particle.js')).text();
        // TODO(sjmiles): brittle content processing
        const preamble = moduleText.indexOf('class Particle');
        moduleText = moduleText.slice(preamble, -3);
        particleSource = `(${moduleText})`;
        //console.log(particleSource);
    }
    return particleSource;
};
export const realmsParticle = kind => {
    return async () => await createRealmsParticle(kind);
};
// factory for import particles
const createRealmsParticle = async (kind) => {
    const compartment = makeCompartment();
    const Particle = await createParticleBase(compartment);
    const implCode = await fetchParticleCode(kind);
    const factory = compartment.evaluate(`${implCode}`);
    const fnpackage = packageSafeFns(compartment, {
        fetch: fetch,
        log: (...stuff) => console.log(`[${kind}]:`, ...stuff)
    });
    return new (factory({ Particle, ...fnpackage }))();
};
const createParticleBase = async (compartment) => {
    const baseCode = await requireParticleBaseCode();
    let Particle;
    try {
        Particle = compartment.evaluate(`${baseCode}`);
    }
    catch (x) {
        console.error(x);
        console.log(baseCode);
        throw x;
    }
    return Particle;
};
const fetchParticleCode = async (kind) => {
    const fileContent = await (await fetch(`../../particles/${kind}.js`)).text();
    // TODO(sjmiles): brittle file processing
    return fileContent.slice(fileContent.indexOf('('));
};

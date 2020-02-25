/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @packageDocumentation
 * @module devices
 */

import {Particle} from '../../core/core-particle.js';

const dispatcher = {
  register({tid, name, src}) {
    if (src[0] === '.') {
      src = `../../../${src}`;
    }
    if (!registry[name]) {
      register(name, src);
    }
    //console.log(`Worker::register('${tid}', '${name}', '${src}')`);
    postMessage({msg: 'registered', tid}, null);

  },
  async create({tid, id, kind}) {
    const pclass = await fetchParticleClass(kind);
    if (!pclass) {
      console.warn(`unregistered class [${kind}]`);
    }
    else {
      const particle = particles[id] = new pclass();
      // TODO(sjmiles): only for logging, inject prebuilt logger instead
      particle.id = id;
      particle.onoutput = model => postMessage({channelId: id, msg: 'output', id, model}, null);
      console.log(`Worker::created('${tid}', '${id}', '${kind}')`);
      postMessage({msg: 'created', tid, id, config: particle.config}, null);
    }
  },
  update({id, inputs}) {
    const particle = getParticle(id);
    particle.doUpdate(inputs);
  },
  event({id, eventlet}) {
    const particle = getParticle(id);
    particle.handleEvent(eventlet);
  }
};

self.onmessage = function(e) {
  const {msg} = e.data;
  if (dispatcher[msg]) {
    try {
      dispatcher[msg](e.data);
    } catch(x) {
    }
  }
  else {
    console.warn('unknown message: ', e.data);
  }
};

const particles = [];

const getParticle = id => {
  const particle = particles[id];
  if (!particle) {
    throw(`worker: no particle matching [${id}]`);
  }
  return particle;
};

const registry = {};

const register = (name, src) => {
  if (!registry[name]) {
    registry[name] = src;
  }
};

const fetchParticleClass = async (name) => {
  let particle = registry[name];
  if (particle) {
    if (typeof particle === 'string') {
      registry[name] = particle = await importParticle(particle);
    }
    return particle;
  }
};

const importParticle = async (src) => {
  // TODO(sjmiles): 3P code (and possible HTTP transactions) invoked
  // at this point: attack vectors are here.
  console.log(`import [${src}]`);
  const {particle} = await import(src);
  const pclass = particle({Particle})
  //console.warn(pclass);
  return pclass;
};

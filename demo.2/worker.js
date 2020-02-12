/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

'use strict';

self.importScripts('./particle.js');

const dispatcher = {
  register({name, src}) {
    if (!registry[name]) {
      register(name, src);
    }
  },
  create({tid, id, name}) {
    const pclass = registry[name];
    if (!pclass) {
      console.warn(`unregistered class [${name}]`);
    }
    else {
      const particle = particles[id] = new pclass();
      particle.hostProxy = {
        renderModel: (model) => postMessage({msg: 'render', id, model})
      }
      const configJSON = JSON.stringify(particle.config);
      postMessage({msg: 'created', tid, id, configJSON});
    }
  },
  update({tid, id, inputJSON}) {
    const inputs = inputJSON ? JSON.parse(inputJSON) : null;
    const particle = getParticle(id);
    const outputs = particle.update(inputs);
    const outputJSON = JSON.stringify(outputs);
    postMessage({msg: 'output', tid, id, outputJSON});
    console.log(`updated particle [${id}]`);
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

//

const particles = [];

const getParticle = id => {
  const particle = particles[id];
  if (!particle) {
    throw(`worker: no particle matching [${id}]`);
  }
  return particle;
};


//

const registry = {};

const register = (name, src) => {
  if (!registry[name]) {
    self.defineParticle = defun => {
      self.particleClass = defun({Particle});
    };
    try {
      // TODO(sjmiles): 3P code (and possible HTTP transactions) invoked
      // at this point: attack vectors are here.
      self.importScripts(src);
    } catch(x) {
    }
    if (self.particleClass) {
      registry[name] = self.particleClass;
      console.log(`worker: successfully registered [${name}]`);
    } else {
      console.warn(`worker: FAILED to register [${name}]`);
    }
  }
};


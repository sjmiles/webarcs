/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Composer} from './composer.js';

const particles = [];

const composer = new Composer(document.body);

const dispatcher = {
  created({id, configJSON}) {
    const config = parse(configJSON);
    particles[id] = config;
    console.log(`ack: particle created: [${id}]; config [${Object.keys(config)}]`);
    worker.postMessage({kind: 'update', id});
  },
  render({id, contentJSON}) {
    const particle = particles[id];
    const content = parse(contentJSON);
    console.log(`ack: particle render: [${id}]; content [${Object.keys(content)}]`);
    composer.render({id, name: '', container: '', content: {template: particle.template, model: content}});
  }
};

const parse = json => json ? JSON.parse(json) : Object;
const worker = new Worker('./worker.js');

worker.onerror = e => {
  console.error(e.message, e);
};

worker.onmessage = e => {
  const {kind} = e.data;
  if (dispatcher[kind]) {
    dispatcher[kind](e.data);
  } else {
    console.warn('unknown message: ', e.data);
  }
};

worker.postMessage({kind: 'register', name: 'Container', src: './particles/container.js'});
worker.postMessage({kind: 'create', name: 'Container', id: '00-00'});

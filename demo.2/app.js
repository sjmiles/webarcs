/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Hub} from './hub.js';
import {Arc, Store} from './arc.js';
import {irand, prob} from './utils.js';

// handles custom messages from the Hub
const dispatcher = {
  // no handlers
};

// initialize particle hub
Hub.init(dispatcher);

// register particles
Hub.send({msg: 'register', name: 'Container', src: './particles/container.js'});
Hub.send({msg: 'register', name: 'Info', src: './particles/info.js'});

// create persistance storage
const persist = new Store(0);
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
  doc.sorted = '';
});

// data mutator for testing
const mutate = (arc) => {
  arc.change(doc => {
    doc.value = irand(9e3) + 1e3;
    doc.name = prob(0.5) ? 'Mundo' : 'Nadie';
    if (prob(0.05)) {
      doc.list.splice(irand(doc.list.length), 1);
    }
    if (prob(0.1)) {
      doc.list.push(['Delta', 'Epsilon', 'Iota'][irand(3)]);
    }
  });
};

const mutateTimes = count => {
  count = count || 0;
  if (count-- >= 0) {
    setTimeout(() => {
      mutate(prob(0.5) ? arc0 : arc1);
      mutateTimes(count);
    }, irand(200, 40));
  } else {
    //setTimeout(() => sync(), 300);
  }
};

// create an arc
const arc0 = new Arc(window.device0, persist);
arc0.addParticle('Container');
arc0.addParticle('Info');

// create an arc
const arc1 = new Arc(window.device1, persist);
arc1.addParticle('Info');

const sync = () => {
  persist.synchronize([arc0, arc1]);
};

//mutate(arc0);
window.test.onclick = () => mutateTimes(15);
window.sync.onclick = () => sync();

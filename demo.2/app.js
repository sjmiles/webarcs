/**
 * @license
 * Copyright 2020 Google LLC.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {Context} from './src/ergo/context.js';
import {Recipe} from './src/ergo/recipe.js';
import {Group} from './src/ergo/group.js';
import {Arc} from './src/core/arc.js';
import {Data} from './src/core/data.js';
import {irand, prob} from './src/core/utils.js';

// register particles
Context.registerParticle('Container', './particles/Container.js');
Context.registerParticle('Info', './particles/Info.js');
Context.registerParticle('SortArray', './particles/SortArray.js');
Context.registerParticle('Shops', './particles/Shops.js');

// create persistance storage
//const persist = new Store(0);
const persist = new Data();
persist.change(doc => {
  doc.list = ['Alpha', 'Beta', 'Gamma'];
  doc.sortedJson = '';
});

// create a data-synchronization group
const group = new Group(persist);

// create an arc
const arc0 = new Arc({name: 'arc0', root: window.device0});
group.addArcs([arc0]);
Recipe.instantiate(arc0, {
  root: [{
    particle: 'Container',
    content: [{
      particle: 'Info'
    }]
  }, {
    particle: 'SortArray'
  }]
});

// create an arc
const arc1 = new Arc({name: 'arc1', root: window.device1});
group.addArcs([arc1]);
Recipe.instantiate(arc1, {
  root: [{
    particle: 'Info'
  }, {
    //particle: 'Shops'
  }]
});

// data mutator for testing
const mutate = (arc) => {
  arc.change(doc => {
    doc.value = irand(9e3) + 1e3;
    doc.name = prob(0.5) ? 'Mundo' : 'Nadie';
    if (prob(0.15)) {
      doc.list.splice(irand(doc.list.length), 1);
    }
    if (prob(0.30)) {
      doc.list.push(['Delta', 'Epsilon', 'Iota'][irand(3)]);
    }
  });
  arc.update();
};

const mutateTimes = count => {
  count = count || 0;
  if (count-- >= 0) {
    setTimeout(() => {
      mutate(prob(0.5) ? arc0 : arc1);
      mutateTimes(count);
    }, irand(200, 40));
  }
};

// world's worst UI

window.test.onclick = () => mutateTimes(15);
//window.sync.onclick = () => synchronize();
window.sync.hidden = true;
window.arcs = {arc0, arc1, persist};

setTimeout(() => mutateTimes(15), 300);

